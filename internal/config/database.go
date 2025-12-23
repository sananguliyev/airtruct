package config

import (
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog/log"
)

const (
	DatabaseTypeSQLite   = "sqlite"
	DatabaseTypePostgres = "postgres"
)

type DatabaseConfig struct {
	Driver string `default:"sqlite"`
	URI    string `required:"true"`
}

func NewDatabaseConfig() *DatabaseConfig {
	var c DatabaseConfig
	err := envconfig.Process("database", &c)
	if err != nil {
		log.Fatal().Err(err).Msg("Processing database config has failed")
	}

	return &c
}
