package cli

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type CoordinatorCLI struct {
	api        *coordinator.CoordinatorAPI
	executor   executor.CoordinatorExecutor
	nodeConfig *config.NodeConfig
}

func NewCoordinatorCLI(api *coordinator.CoordinatorAPI, executor executor.CoordinatorExecutor, config *config.NodeConfig) *CoordinatorCLI {
	return &CoordinatorCLI{api, executor, config}
}

func (c *CoordinatorCLI) Run(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	go func(ctx context.Context) {
		for range ticker.C {
			err := c.executor.CheckWorkersAndAssignStreams(ctx)
			if err != nil {
				log.Error().Err(err).Msg("Failed to perform worker health check and assign streams")
			}
		}
	}(ctx)

	go func(ctx context.Context) {
		for range ticker.C {
			err := c.executor.CheckWorkerStreams(ctx)
			if err != nil {
				log.Error().Err(err).Msg("Failed to perform worker stream health check")
			}
		}
	}(ctx)

	log.Info().Int32("port", c.nodeConfig.GRPCPort).Msg("starting coordinator GRPC server")

	coordinatorServerAddress := fmt.Sprintf(":%d", c.nodeConfig.GRPCPort)
	lis, err := net.Listen("tcp", coordinatorServerAddress)
	if err != nil {
		log.Fatal().Err(err).Int32("port", c.nodeConfig.GRPCPort).Msg("failed to listen GRPC port")
	}

	grpcServer := grpc.NewServer()
	pb.RegisterCoordinatorServer(grpcServer, c.api)

	go func() {
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatal().Err(err).Msg("failed to serve GRPC")
		}
	}()

	// Register gRPC server endpoint
	// Note: Make sure the gRPC server is running properly and accessible
	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{}),
	)
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	if err = pb.RegisterCoordinatorHandlerFromEndpoint(ctx, mux, coordinatorServerAddress, opts); err != nil {
		log.Fatal().Err(err).Msg("failed to register coordinator handler")
	}

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Accept-Encoding", "Authorization", "Content-Type", "Origin"},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // Maximum age for preflight cache (in seconds)
	})

	// start listening to requests from the gateway server
	log.Info().Msgf("API gateway server listening on port %d", c.nodeConfig.Port)
	if err = http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", c.nodeConfig.Port), corsMiddleware.Handler(mux)); err != nil {
		log.Fatal().Err(err).Msg("failed to serve coordinator handler")
	}
}
