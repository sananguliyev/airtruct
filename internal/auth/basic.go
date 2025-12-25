package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/config"
)

type BasicAuthHandler struct {
	username    string
	password    string
	sessions    map[string]*BasicSession
	sessionsMux sync.RWMutex
	cookieName  string
}

type BasicSession struct {
	Username  string
	CreatedAt time.Time
	ExpiresAt time.Time
}

func NewBasicAuthHandler(cfg *config.AuthConfig) *BasicAuthHandler {
	handler := &BasicAuthHandler{
		username:   cfg.BasicUsername,
		password:   cfg.BasicPassword,
		sessions:   make(map[string]*BasicSession),
		cookieName: "airtruct_session",
	}

	go handler.cleanupExpiredSessions()

	return handler
}

func (h *BasicAuthHandler) Middleware(next http.Handler) http.Handler {
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

		w.WriteHeader(http.StatusUnauthorized)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"error":"Unauthorized"}`))
	})
}

func (h *BasicAuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var loginReq struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	usernameMatch := subtle.ConstantTimeCompare([]byte(loginReq.Username), []byte(h.username)) == 1
	passwordMatch := subtle.ConstantTimeCompare([]byte(loginReq.Password), []byte(h.password)) == 1

	if !usernameMatch || !passwordMatch {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token := h.createSession(loginReq.Username)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token":      token,
		"token_type": "Bearer",
	})
}

func (h *BasicAuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := authHeader[7:]
		h.sessionsMux.Lock()
		delete(h.sessions, token)
		h.sessionsMux.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *BasicAuthHandler) createSession(username string) string {
	sessionID := h.generateSessionID()
	session := &BasicSession{
		Username:  username,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	h.sessionsMux.Lock()
	h.sessions[sessionID] = session
	h.sessionsMux.Unlock()

	log.Info().Str("username", username).Str("sessionID", sessionID).Msg("Created basic auth session")
	return sessionID
}

func (h *BasicAuthHandler) generateSessionID() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (h *BasicAuthHandler) cleanupExpiredSessions() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		h.sessionsMux.Lock()
		now := time.Now()
		for id, session := range h.sessions {
			if now.After(session.ExpiresAt) {
				delete(h.sessions, id)
				log.Debug().Str("sessionID", id).Msg("Cleaned up expired basic auth session")
			}
		}
		h.sessionsMux.Unlock()
	}
}

func (h *BasicAuthHandler) isValidSession(sessionID string) bool {
	h.sessionsMux.RLock()
	defer h.sessionsMux.RUnlock()

	session, exists := h.sessions[sessionID]
	if !exists {
		return false
	}

	return time.Now().Before(session.ExpiresAt)
}
