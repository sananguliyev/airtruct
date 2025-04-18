package cli

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"

	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	pb "github.com/sananguliyev/airtruct/internal/protorender"
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
	go c.runHTTPServer()

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

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", c.nodeConfig.GRPCPort))
	if err != nil {
		log.Fatal().Err(err).Int32("port", c.nodeConfig.GRPCPort).Msg("failed to listen GRPC port")
	}

	grpcServer := grpc.NewServer()
	pb.RegisterCoordinatorServer(grpcServer, c.api)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatal().Err(err).Msg("failed to serve GRPC")
	}
}

func (c *CoordinatorCLI) runHTTPServer() {
	router := httprouter.New()

	corsInstance := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug:            false,
	})

	handler := corsInstance.Handler(router)

	router.NotFound = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"error": "not found"}`, http.StatusNotFound)
	})
	router.MethodNotAllowed = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"error": "method not allowed"}`, http.StatusMethodNotAllowed)
	})

	//router.POST("/workers", c.api.RegisterWorker)
	//router.DELETE("/workers/:id", c.api.DeregisterWorker)
	//router.PUT("/workers/stream", c.api.UpdateWorkerStreamStatus)
	router.GET("/workers/:status", c.api.ListWorkers)
	router.POST("/component-configs", c.api.CreateComponent)
	router.GET("/component-configs/:id", c.api.GetComponentConfig)
	router.PUT("/component-configs/:id", c.api.UpdateComponentConfig)
	router.GET("/component-configs", c.api.ListComponents)
	router.POST("/streams", c.api.CreateStream)
	router.GET("/streams/:id", c.api.GetStream)
	router.PUT("/streams/:id", c.api.UpdateStream)
	router.GET("/streams", c.api.ListStreams)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", c.nodeConfig.Port), handler); err != nil {
		log.Fatal().Err(err).Msg("Failed to start coordinator")
	}

	log.Info().Int("port", c.nodeConfig.Port).Msg("started coordinator HTTP server")
}
