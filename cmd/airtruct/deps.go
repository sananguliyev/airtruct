package main

import (
	"github.com/sananguliyev/airtruct/internal/api"
	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/cli"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	"github.com/sananguliyev/airtruct/internal/persistence"

	_ "github.com/warpstreamlabs/bento/public/components/all"
)

func InitializeCoordinatorCommand(httpPort, grpcPort uint32) *cli.CoordinatorCLI {
	databaseConfig := config.NewDatabaseConfig()
	db := persistence.NewGormDB(databaseConfig)
	eventRepository := persistence.NewEventRepository(db)
	streamRepository := persistence.NewStreamRepository(db)
	workerRepository := persistence.NewWorkerRepository(db)
	workerStreamRepository := persistence.NewWorkerStreamRepository(db)
	coordinatorAPI := coordinator.NewCoordinatorAPI(eventRepository, streamRepository, workerRepository, workerStreamRepository)
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
