package main

import (
	"github.com/rs/zerolog/log"
	_ "github.com/warpstreamlabs/bento/public/components/all"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/sananguliyev/airtruct/internal/api"
	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/auth"
	"github.com/sananguliyev/airtruct/internal/cli"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/ratelimiter"
	"github.com/sananguliyev/airtruct/internal/vault"
)

func InitializeCoordinatorCommand(httpPort, grpcPort uint32) *cli.CoordinatorCLI {
	databaseConfig := config.NewDatabaseConfig()
	db := persistence.NewGormDB(databaseConfig)
	secretConfig := config.NewSecretConfig()
	authConfig := config.NewAuthConfig()
	authManager, err := auth.NewManager(authConfig, secretConfig.Key)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create auth manager")
		return nil
	}
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
	cacheRepository := persistence.NewCacheRepository(db)
	streamCacheRepository := persistence.NewStreamCacheRepository(db)
	bufferRepository := persistence.NewBufferRepository(db)
	streamBufferRepository := persistence.NewStreamBufferRepository(db)
	rateLimitRepository := persistence.NewRateLimitRepository(db)
	rateLimitStateRepository := persistence.NewRateLimitStateRepository(db)
	streamRateLimitRepository := persistence.NewStreamRateLimitRepository(db)
	rateLimiterEngine := ratelimiter.NewEngine(rateLimitRepository, rateLimitStateRepository)
	coordinatorAPI := coordinator.NewCoordinatorAPI(eventRepository, streamRepository, streamCacheRepository, streamRateLimitRepository, streamBufferRepository, workerRepository, workerStreamRepository, secretRepository, cacheRepository, bufferRepository, rateLimitRepository, rateLimiterEngine, aesgcm)
	coordinatorExecutor := executor.NewCoordinatorExecutor(workerRepository, streamRepository, streamCacheRepository, streamRateLimitRepository, workerStreamRepository)
	coordinatorCLI := cli.NewCoordinatorCLI(coordinatorAPI, coordinatorExecutor, rateLimiterEngine, authManager, httpPort, grpcPort)
	return coordinatorCLI
}

func InitializeWorkerCommand(discoveryUri string, grpcPort uint32) *cli.WorkerCLI {
	secretConfig := config.NewSecretConfig()

	grpcConn, err := grpc.NewClient(discoveryUri, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create grpc client")
	}

	vaultProvider := vault.NewLocalProvider(secretConfig, grpcConn)
	workerExecutor := executor.NewWorkerExecutor(grpcConn, grpcPort, vaultProvider)
	workerAPI := api.NewWorkerAPI(workerExecutor)
	workerCLI := cli.NewWorkerCLI(workerAPI, workerExecutor, grpcPort)
	return workerCLI
}
