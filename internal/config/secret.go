package config

import (
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog/log"
)

const (
	SecretProviderLocal = "local"
)

type SecretConfig struct {
	Provider string `default:"local"`
	Key      string `required:"true"`
}

func NewSecretConfig() *SecretConfig {
	var c SecretConfig
	err := envconfig.Process("secret", &c)
	if err != nil {
		log.Fatal().Err(err).Msg("Processing secret config has failed")
	}

	return &c
}
