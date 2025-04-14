package api

import (
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/executor"
)

type WorkerAPI interface {
	StartStream(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	HealthCheck(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
}

type worker struct {
	workerExecutor executor.WorkerExecutor
}

func NewWorkerAPI(workerExecutor executor.WorkerExecutor) WorkerAPI {
	return &worker{workerExecutor}
}

func (c *worker) StartStream(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var body struct {
		WorkerStreamID int    `json:"worker_stream_id"`
		Config         string `json:"config"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Debug().
		Int("worker_stream_id", body.WorkerStreamID).
		Str("config", body.Config).
		Msg("Starting stream for processing")

	c.workerExecutor.StartStream(body.WorkerStreamID, body.Config)

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Stream started for processing"})
}

func (c *worker) HealthCheck(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
