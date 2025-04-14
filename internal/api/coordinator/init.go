package coordinator

import (
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"

	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorAPI interface {
	RegisterWorker(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	DeregisterWorker(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	ListWorkers(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	CreateComponent(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	GetComponentConfig(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	UpdateComponentConfig(w http.ResponseWriter, r *http.Request, _ httprouter.Params)
	ListComponents(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	CreateStream(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	GetStream(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	ListStreams(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	UpdateStream(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
	UpdateWorkerStreamStatus(w http.ResponseWriter, r *http.Request, ps httprouter.Params)
}

type coordinator struct {
	config              *config.NodeConfig
	workerRepo          persistence.WorkerRepository
	componentConfigRepo persistence.ComponentConfigRepository
	streamRepo          persistence.StreamRepository
	workerStreamRepo    persistence.WorkerStreamRepository
}

func NewCoordinatorAPI(
	workerRepo persistence.WorkerRepository,
	componentConfigRepo persistence.ComponentConfigRepository,
	streamRepo persistence.StreamRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	config *config.NodeConfig,
) CoordinatorAPI {
	return &coordinator{config, workerRepo, componentConfigRepo, streamRepo, workerStreamRepo}
}

func (c *coordinator) UpdateWorkerStreamStatus(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var err error

	var body struct {
		WorkerStreamID int                            `json:"worker_stream_id"`
		Status         persistence.WorkerStreamStatus `json:"status"`
	}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err = c.workerStreamRepo.UpdateStatus(body.WorkerStreamID, body.Status); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Worker Stream status has been updated successfully"})
}
