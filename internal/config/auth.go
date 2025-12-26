package config

import (
	"fmt"

	"github.com/kelseyhightower/envconfig"
)

type AuthType string

const (
	AuthTypeNone   AuthType = "none"
	AuthTypeBasic  AuthType = "basic"
	AuthTypeOAuth2 AuthType = "oauth2"
)

type AuthConfig struct {
	Type AuthType `envconfig:"AUTH_TYPE" default:"none"`

	BasicUsername string `envconfig:"AUTH_BASIC_USERNAME"`
	BasicPassword string `envconfig:"AUTH_BASIC_PASSWORD"`

	OAuth2ClientID          string   `envconfig:"AUTH_OAUTH2_CLIENT_ID"`
	OAuth2ClientSecret      string   `envconfig:"AUTH_OAUTH2_CLIENT_SECRET"`
	OAuth2AuthorizationURL  string   `envconfig:"AUTH_OAUTH2_AUTHORIZATION_URL"`
	OAuth2TokenURL          string   `envconfig:"AUTH_OAUTH2_TOKEN_URL"`
	OAuth2RedirectURL       string   `envconfig:"AUTH_OAUTH2_REDIRECT_URL"`
	OAuth2Scopes            []string `envconfig:"AUTH_OAUTH2_SCOPES"`
	OAuth2UserInfoURL       string   `envconfig:"AUTH_OAUTH2_USER_INFO_URL"`
	OAuth2AllowedUsers      []string `envconfig:"AUTH_OAUTH2_ALLOWED_USERS"`
	OAuth2AllowedDomains    []string `envconfig:"AUTH_OAUTH2_ALLOWED_DOMAINS"`
	OAuth2SessionCookieName string   `envconfig:"AUTH_OAUTH2_SESSION_COOKIE_NAME" default:"airtruct_session"`
}

func NewAuthConfig() *AuthConfig {
	var cfg AuthConfig
	if err := envconfig.Process("", &cfg); err != nil {
		panic(fmt.Errorf("failed to load auth config: %w", err))
	}
	return &cfg
}

func (c *AuthConfig) Validate() error {
	switch c.Type {
	case AuthTypeNone:
		return nil
	case AuthTypeBasic:
		if c.BasicUsername == "" || c.BasicPassword == "" {
			return fmt.Errorf("basic auth requires AUTH_BASIC_USERNAME and AUTH_BASIC_PASSWORD")
		}
		return nil
	case AuthTypeOAuth2:
		if c.OAuth2ClientID == "" {
			return fmt.Errorf("oauth2 requires AUTH_OAUTH2_CLIENT_ID")
		}
		if c.OAuth2ClientSecret == "" {
			return fmt.Errorf("oauth2 requires AUTH_OAUTH2_CLIENT_SECRET")
		}
		if c.OAuth2AuthorizationURL == "" {
			return fmt.Errorf("oauth2 requires AUTH_OAUTH2_AUTHORIZATION_URL")
		}
		if c.OAuth2TokenURL == "" {
			return fmt.Errorf("oauth2 requires AUTH_OAUTH2_TOKEN_URL")
		}
		if c.OAuth2RedirectURL == "" {
			return fmt.Errorf("oauth2 requires AUTH_OAUTH2_REDIRECT_URL")
		}
		return nil
	default:
		return fmt.Errorf("invalid auth type: %s (must be none, basic, or oauth2)", c.Type)
	}
}
