package cli

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/api"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	pb "github.com/sananguliyev/airtruct/internal/protorender"
	"google.golang.org/grpc"
)

type WorkerCLI struct {
	api        *api.WorkerAPI
	executor   executor.WorkerExecutor
	nodeConfig *config.NodeConfig
}

func NewWorkerCLI(api *api.WorkerAPI, executor executor.WorkerExecutor, config *config.NodeConfig) *WorkerCLI {
	return &WorkerCLI{api, executor, config}
}

func (c *WorkerCLI) Run(ctx context.Context) {
	var err error

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	go func() {
		if err = c.executor.JoinToCoordinator(ctx); err != nil {
			log.Fatal().Err(err).Msg("Failed to register on coordinator")
		}

		c.executor.ConsumeStreamQueue(ctx)
		log.Info().Msg("Worker started consuming stream queue")
		c.executor.ShipLogs(ctx)
		log.Info().Msg("Worker started shipping logs")

		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Worker stopping...")
				c.executor.ShipLogs(ctx)
				if err = c.executor.LeaveCoordinator(ctx); err != nil {
					log.Error().Err(err).Msg("Failed to leave coordinator and this will be handled in coordinator")
				}
				log.Info().Msg("Worker stopped")
				return
			case <-ticker.C:
				if err = c.executor.JoinToCoordinator(ctx); err != nil {
					log.Fatal().Err(err).Msg("Failed to register on coordinator")
				}
			}
		}
	}()

	log.Info().Int32("port", c.nodeConfig.GRPCPort).Msg("starting coordinator GRPC server")
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", c.nodeConfig.GRPCPort))
	if err != nil {
		log.Fatal().Err(err).Int32("port", c.nodeConfig.GRPCPort).Msg("failed to listen GRPC port")
	}

	grpcServer := grpc.NewServer()
	pb.RegisterWorkerServer(grpcServer, c.api)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatal().Err(err).Msg("failed to serve GRPC")
	}
}
