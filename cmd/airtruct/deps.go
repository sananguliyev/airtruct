package main

import (
	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/api"
	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/cli"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/vault"
	_ "github.com/warpstreamlabs/bento/public/components/all"
)

func InitializeCoordinatorCommand(httpPort, grpcPort uint32) *cli.CoordinatorCLI {
	databaseConfig := config.NewDatabaseConfig()
	db := persistence.NewGormDB(databaseConfig)
	secretConfig := config.NewSecretConfig()
	aesgcm, err := vault.NewAESGCM([]byte(secretConfig.Key))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create AESGCM")
		return nil
	}
	eventRepository := persistence.NewEventRepository(db)
	streamRepository := persistence.NewStreamRepository(db)
	workerRepository := persistence.NewWorkerRepository(db)
	workerStreamRepository := persistence.NewWorkerStreamRepository(db)
	secretRepository := persistence.NewSecretRepository(db)
	coordinatorAPI := coordinator.NewCoordinatorAPI(eventRepository, streamRepository, workerRepository, workerStreamRepository, secretRepository, aesgcm)
	coordinatorExecutor := executor.NewCoordinatorExecutor(workerRepository, streamRepository, workerStreamRepository)
	coordinatorCLI := cli.NewCoordinatorCLI(coordinatorAPI, coordinatorExecutor, httpPort, grpcPort)
	return coordinatorCLI
}

func InitializeWorkerCommand(discoveryUri string, grpcPort uint32) *cli.WorkerCLI {
	workerExecutor := executor.NewWorkerExecutor(discoveryUri, grpcPort)
	workerAPI := api.NewWorkerAPI(workerExecutor)
	workerCLI := cli.NewWorkerCLI(workerAPI, workerExecutor, grpcPort)
	return workerCLI
}
