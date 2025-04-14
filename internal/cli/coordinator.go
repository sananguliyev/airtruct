package cli

import (
	"fmt"
	"net/http"
	"time"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
)

type CoordinatorCLI struct {
	api        coordinator.CoordinatorAPI
	executor   executor.CoordinatorExecutor
	nodeConfig *config.NodeConfig
}

func NewCoordinatorCLI(api coordinator.CoordinatorAPI, executor executor.CoordinatorExecutor, config *config.NodeConfig) *CoordinatorCLI {
	return &CoordinatorCLI{api, executor, config}
}

func (c *CoordinatorCLI) Run() {
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

	router.POST("/workers", c.api.RegisterWorker)
	router.DELETE("/workers/:id", c.api.DeregisterWorker)
	router.GET("/workers/:status", enableCORS(c.api.ListWorkers))
	router.POST("/component-configs", c.api.CreateComponent)
	router.GET("/component-configs/:id", c.api.GetComponentConfig)
	router.PUT("/component-configs/:id", c.api.UpdateComponentConfig)
	router.GET("/component-configs", c.api.ListComponents)
	router.POST("/streams", c.api.CreateStream)
	router.GET("/streams/:id", c.api.GetStream)
	router.PUT("/streams/:id", c.api.UpdateStream)
	router.GET("/streams", c.api.ListStreams)
	router.PUT("/worker/stream", c.api.UpdateWorkerStreamStatus)

	ticker := time.NewTicker(30 * time.Second)

	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ticker.C:
				err := c.executor.CheckWorkersAndAssignStreams()
				if err != nil {
					log.Error().Err(err).Msg("Failed to perform worker health check and assign streams")
				}
			}
		}
	}()

	go func() {
		for {
			select {
			case <-ticker.C:
				err := c.executor.CheckWorkerStreams()
				if err != nil {
					log.Error().Err(err).Msg("Failed to perform worker stream health check")
				}
			}
		}
	}()

	if err := http.ListenAndServe(fmt.Sprintf(":%d", c.nodeConfig.Port), handler); err != nil {
		log.Fatal().Err(err).Msg("Failed to start coordinator")
	}

	log.Info().Int("port", c.nodeConfig.Port).Msg("started coordinator")
}

func enableCORS(next httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		// Set headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next(w, r, ps)
	}
}
