//go:build wireinject
// +build wireinject

package main

import (
	"github.com/sananguliyev/airtruct/internal/api"
	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/cli"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	"github.com/sananguliyev/airtruct/internal/persistence"

	"github.com/google/wire"
)

func InitializeCoordinatorCommand() *cli.CoordinatorCLI {
	wire.Build(
		config.NewDatabaseConfig,
		config.NewNodeConfig,
		persistence.NewGormDB,
		persistence.NewComponentRepository,
		persistence.NewEventRepository,
		persistence.NewStreamRepository,
		persistence.NewWorkerRepository,
		persistence.NewWorkerStreamRepository,
		executor.NewCoordinatorExecutor,
		coordinator.NewCoordinatorAPI,
		cli.NewCoordinatorCLI,
	)
	return &cli.CoordinatorCLI{}
}

func InitializeWorkerCommand() *cli.WorkerCLI {
	wire.Build(
		config.NewNodeConfig,
		executor.NewWorkerExecutor,
		api.NewWorkerAPI,
		cli.NewWorkerCLI,
	)
	return &cli.WorkerCLI{}
}
