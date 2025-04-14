package coordinator

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

func (c *coordinator) RegisterWorker(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var workerEntity *persistence.Worker
	var err error

	var body struct {
		ID   string `json:"id"`
		Port int    `json:"port"`
	}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	address, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		http.Error(w, "invalid remote address", http.StatusInternalServerError)
		return
	}

	if ip := net.ParseIP(address); ip != nil {
		if ip.IsLoopback() {
			address = "127.0.0.1" // Convert loopback IPv6 to IPv4 for better readability
		}
	}

	workerEntity, err = c.workerRepo.FindByID(body.ID)
	if err != nil {
		log.Error().Err(err).Str("worker_id", body.ID).Msg("Failed to find worker")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if workerEntity != nil && workerEntity.Status == persistence.WorkerStatusActive {
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "Worker has already been registered"})
		return
	}

	if workerEntity != nil {
		workerEntity.Address = fmt.Sprintf("%s:%d", address, body.Port)
		workerEntity.Status = persistence.WorkerStatusActive
	} else {
		workerEntity = &persistence.Worker{
			ID:      body.ID,
			Address: fmt.Sprintf("%s:%d", address, body.Port),
			Status:  persistence.WorkerStatusActive,
		}
	}

	if err = c.workerRepo.AddOrActivate(workerEntity); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Info().Str("worker_id", workerEntity.ID).Str("address", workerEntity.Address).Msg("Worker registered")

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Worker registered successfully"})
}

func (c *coordinator) DeregisterWorker(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")

	w.Header().Set("Content-Type", "application/json")

	err := c.workerRepo.Deactivate(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Worker deregistered successfully"})
}

func (c *coordinator) ListWorkers(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	status := []persistence.WorkerStatus{persistence.WorkerStatusActive, persistence.WorkerStatusInactive}

	if ps.ByName("status") != "all" {
		status = []persistence.WorkerStatus{persistence.WorkerStatus(ps.ByName("name"))}
	}

	workers, err := c.workerRepo.FindAllByStatuses(status...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(workers); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
