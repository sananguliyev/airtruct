package cli

import (
	"fmt"
	"net/http"
	"time"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/api"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
)

type WorkerCLI struct {
	api        api.WorkerAPI
	executor   executor.WorkerExecutor
	nodeConfig *config.NodeConfig
}

func NewWorkerCLI(api api.WorkerAPI, executor executor.WorkerExecutor, config *config.NodeConfig) *WorkerCLI {
	return &WorkerCLI{api, executor, config}
}

func (c *WorkerCLI) Run() {
	var err error

	ticker := time.NewTicker(5 * time.Second)

	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ticker.C:
				if err = c.executor.JoinToCoordinator(); err != nil {
					log.Fatal().Err(err).Msg("Failed to register on coordinator")
				}
			}
		}
	}()

	router := httprouter.New()
	router.POST("/assign-stream", c.api.StartStream)
	router.GET("/healthz", c.api.HealthCheck)

	if err = http.ListenAndServe(fmt.Sprintf(":%d", c.nodeConfig.Port), router); err != nil {
		log.Fatal().Err(err).Msg("Failed to start worker")
	}

	log.Info().Int("port", c.nodeConfig.Port).Msg("started worker")
}
