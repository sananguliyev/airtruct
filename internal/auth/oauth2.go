package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/config"
	"golang.org/x/oauth2"
)

type OAuth2Handler struct {
	config         *oauth2.Config
	userInfoURL    string
	allowedUsers   map[string]bool
	allowedDomains map[string]bool
	sessionSecret  string
	cookieName     string
	sessions       map[string]*Session
	sessionsMux    sync.RWMutex
	stateStore     map[string]time.Time
	stateStoreMux  sync.RWMutex
}

type Session struct {
	UserEmail string
	Token     *oauth2.Token
	CreatedAt time.Time
	ExpiresAt time.Time
}

type UserInfo struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func NewOAuth2Handler(cfg *config.AuthConfig) *OAuth2Handler {
	oauth2Config := &oauth2.Config{
		ClientID:     cfg.OAuth2ClientID,
		ClientSecret: cfg.OAuth2ClientSecret,
		Endpoint: oauth2.Endpoint{
			AuthURL:  cfg.OAuth2AuthorizationURL,
			TokenURL: cfg.OAuth2TokenURL,
		},
		RedirectURL: cfg.OAuth2RedirectURL,
		Scopes:      cfg.OAuth2Scopes,
	}

	allowedUsers := make(map[string]bool)
	for _, user := range cfg.OAuth2AllowedUsers {
		allowedUsers[strings.ToLower(user)] = true
	}

	allowedDomains := make(map[string]bool)
	for _, domain := range cfg.OAuth2AllowedDomains {
		allowedDomains[strings.ToLower(domain)] = true
	}

	handler := &OAuth2Handler{
		config:         oauth2Config,
		userInfoURL:    cfg.OAuth2UserInfoURL,
		allowedUsers:   allowedUsers,
		allowedDomains: allowedDomains,
		sessionSecret:  cfg.OAuth2SessionSecret,
		cookieName:     cfg.OAuth2SessionCookieName,
		sessions:       make(map[string]*Session),
		stateStore:     make(map[string]time.Time),
	}

	go handler.cleanupExpiredSessions()
	go handler.cleanupExpiredStates()

	return handler
}

func (h *OAuth2Handler) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token := authHeader[7:]
			h.sessionsMux.RLock()
			session, exists := h.sessions[token]
			h.sessionsMux.RUnlock()

			if exists && time.Now().Before(session.ExpiresAt) {
				next.ServeHTTP(w, r)
				return
			}
		}

		cookie, err := r.Cookie(h.cookieName)
		if err != nil {
			h.redirectToLogin(w, r)
			return
		}

		sessionID := cookie.Value
		h.sessionsMux.RLock()
		session, exists := h.sessions[sessionID]
		h.sessionsMux.RUnlock()

		if !exists || time.Now().After(session.ExpiresAt) {
			h.redirectToLogin(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (h *OAuth2Handler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	state := h.generateState()
	h.stateStoreMux.Lock()
	h.stateStore[state] = time.Now().Add(10 * time.Minute)
	h.stateStoreMux.Unlock()

	url := h.config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *OAuth2Handler) HandleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	if !h.validateState(state) {
		log.Error().Msg("Invalid OAuth2 state parameter")
		http.Redirect(w, r, "/login?error=invalid_state", http.StatusTemporaryRedirect)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		log.Error().Msg("Missing OAuth2 authorization code")
		http.Redirect(w, r, "/login?error=missing_code", http.StatusTemporaryRedirect)
		return
	}

	token, err := h.config.Exchange(context.Background(), code)
	if err != nil {
		log.Error().Err(err).Msg("Failed to exchange OAuth2 code for token")
		http.Redirect(w, r, "/login?error=token_exchange_failed", http.StatusTemporaryRedirect)
		return
	}

	userInfo, err := h.fetchUserInfo(token)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch user info")
		http.Redirect(w, r, "/login?error=user_info_failed", http.StatusTemporaryRedirect)
		return
	}

	if !h.isUserAllowed(userInfo.Email) {
		log.Warn().Str("email", userInfo.Email).Msg("User not allowed to access")
		http.Redirect(w, r, "/login?error=access_denied", http.StatusTemporaryRedirect)
		return
	}

	sessionID := h.createSession(userInfo.Email, token)

	http.Redirect(w, r, fmt.Sprintf("/?token=%s", sessionID), http.StatusTemporaryRedirect)
}

func (h *OAuth2Handler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(h.cookieName)
	if err == nil {
		sessionID := cookie.Value
		h.sessionsMux.Lock()
		delete(h.sessions, sessionID)
		h.sessionsMux.Unlock()
	}

	http.SetCookie(w, &http.Cookie{
		Name:     h.cookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logged out successfully"))
}

func (h *OAuth2Handler) fetchUserInfo(token *oauth2.Token) (*UserInfo, error) {
	log.Debug().
		Str("url", h.userInfoURL).
		Bool("token_valid", token.Valid()).
		Str("token_type", token.TokenType).
		Msg("Fetching user info from OAuth2 provider")

	client := h.config.Client(context.Background(), token)
	resp, err := client.Get(h.userInfoURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Error().
			Int("status", resp.StatusCode).
			Str("url", h.userInfoURL).
			Str("response_body", string(bodyBytes)).
			Str("content_type", resp.Header.Get("Content-Type")).
			Bool("token_valid", token.Valid()).
			Msg("User info request failed - check OAuth2 provider configuration and token")
		return nil, fmt.Errorf("user info request failed with status: %d", resp.StatusCode)
	}

	var userInfo UserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &userInfo, nil
}

func (h *OAuth2Handler) isUserAllowed(email string) bool {
	email = strings.ToLower(email)

	if len(h.allowedUsers) == 0 && len(h.allowedDomains) == 0 {
		return true
	}

	if h.allowedUsers[email] {
		return true
	}

	parts := strings.Split(email, "@")
	if len(parts) == 2 {
		domain := parts[1]
		if h.allowedDomains[domain] {
			return true
		}
	}

	return false
}

func (h *OAuth2Handler) createSession(email string, token *oauth2.Token) string {
	sessionID := h.generateSessionID()
	session := &Session{
		UserEmail: email,
		Token:     token,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	h.sessionsMux.Lock()
	h.sessions[sessionID] = session
	h.sessionsMux.Unlock()

	log.Info().Str("email", email).Str("sessionID", sessionID).Msg("Created new session")
	return sessionID
}

func (h *OAuth2Handler) generateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (h *OAuth2Handler) generateSessionID() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (h *OAuth2Handler) validateState(state string) bool {
	h.stateStoreMux.Lock()
	defer h.stateStoreMux.Unlock()

	expiresAt, exists := h.stateStore[state]
	if !exists {
		return false
	}

	if time.Now().After(expiresAt) {
		delete(h.stateStore, state)
		return false
	}

	delete(h.stateStore, state)
	return true
}

func (h *OAuth2Handler) redirectToLogin(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/auth/login", http.StatusTemporaryRedirect)
}

func (h *OAuth2Handler) cleanupExpiredSessions() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		h.sessionsMux.Lock()
		now := time.Now()
		for id, session := range h.sessions {
			if now.After(session.ExpiresAt) {
				delete(h.sessions, id)
				log.Debug().Str("sessionID", id).Msg("Cleaned up expired session")
			}
		}
		h.sessionsMux.Unlock()
	}
}

func (h *OAuth2Handler) cleanupExpiredStates() {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		h.stateStoreMux.Lock()
		now := time.Now()
		for state, expiresAt := range h.stateStore {
			if now.After(expiresAt) {
				delete(h.stateStore, state)
			}
		}
		h.stateStoreMux.Unlock()
	}
}

func (h *OAuth2Handler) isValidSession(sessionID string) bool {
	h.sessionsMux.RLock()
	defer h.sessionsMux.RUnlock()

	session, exists := h.sessions[sessionID]
	if !exists {
		return false
	}

	return time.Now().Before(session.ExpiresAt)
}
