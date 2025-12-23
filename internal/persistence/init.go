package persistence

import (
	configstruct "github.com/sananguliyev/airtruct/internal/config"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func NewGormDB(config *configstruct.DatabaseConfig) *gorm.DB {
	var db *gorm.DB
	var err error

	switch config.Driver {
	case configstruct.DatabaseTypeSQLite:
		db, err = gorm.Open(sqlite.Open(config.URI), &gorm.Config{TranslateError: true})
	case configstruct.DatabaseTypePostgres:
		db, err = gorm.Open(postgres.Open(config.URI), &gorm.Config{TranslateError: true})
	default:
		log.Fatal().Msg("Unsupported database driver")
		return nil
	}

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
		return nil
	}

	err = db.AutoMigrate(&Event{}, &Stream{}, &StreamProcessor{}, &StreamCache{}, &Worker{}, &WorkerStream{}, &Secret{}, &Cache{}, &RateLimit{}, &RateLimitState{}, &StreamRateLimit{})
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to migrate database")
	}

	return db
}
