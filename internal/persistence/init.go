package persistence

import (
	configstruct "github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/logger"
	"github.com/sananguliyev/airtruct/internal/persistence/migrations"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func NewGormDB(config *configstruct.DatabaseConfig) *gorm.DB {
	var db *gorm.DB
	var err error

	customLogger := logger.NewGormLogger(log.Logger)

	gormConfig := &gorm.Config{
		TranslateError: true,
		Logger:         customLogger,
	}

	var dialect string

	switch config.Driver {
	case configstruct.DatabaseTypeSQLite:
		db, err = gorm.Open(sqlite.Open(config.URI), gormConfig)
		dialect = "sqlite"
	case configstruct.DatabaseTypePostgres:
		db, err = gorm.Open(postgres.Open(config.URI), gormConfig)
		dialect = "postgres"
	default:
		log.Fatal().Msg("Unsupported database driver")
		return nil
	}

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
		return nil
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to get underlying sql.DB")
		return nil
	}

	if err := migrations.Run(sqlDB, dialect); err != nil {
		log.Fatal().Err(err).Msg("Failed to run migrations")
	}

	return db
}
