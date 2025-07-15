package coordinator

import (
	"context"
	"sync"

	"github.com/rs/zerolog/log"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

type WorkerManager interface {
	GetHealthyWorkers(ctx context.Context) ([]persistence.Worker, error)
	DeactivateWorker(workerID string) error
	GetWorkerClient(worker *persistence.Worker) (pb.WorkerClient, error)
}

type workerManager struct {
	mu               sync.Mutex
	workerRepo       persistence.WorkerRepository
	workerStreamRepo persistence.WorkerStreamRepository
	clientManager    GRPCClientManager
}

func NewWorkerManager(
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	clientManager GRPCClientManager,
) WorkerManager {
	return &workerManager{
		workerRepo:       workerRepo,
		workerStreamRepo: workerStreamRepo,
		clientManager:    clientManager,
	}
}

func (m *workerManager) GetHealthyWorkers(ctx context.Context) ([]persistence.Worker, error) {
	workers, err := m.workerRepo.FindAllActiveWithRunningStreamCount()
	if err != nil {
		return nil, err
	}

	var healthyWorkers []persistence.Worker
	for _, worker := range workers {
		if m.isWorkerHealthy(ctx, &worker) {
			healthyWorkers = append(healthyWorkers, worker)
		}
	}

	return healthyWorkers, nil
}

func (m *workerManager) DeactivateWorker(workerID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := m.workerRepo.Deactivate(workerID); err != nil {
		log.Error().Err(err).Str("worker_id", workerID).Msg("Failed to deactivate worker")
		return err
	}

	if err := m.workerStreamRepo.StopAllRunningAndWaitingByWorkerID(workerID); err != nil {
		log.Warn().Err(err).Str("worker_id", workerID).Msg("Failed to update all worker streams statuses in worker")
		return err
	}

	m.clientManager.RemoveClient(workerID)

	log.Info().Str("worker_id", workerID).Msg("Worker is unhealthy and deactivated")
	return nil
}

func (m *workerManager) GetWorkerClient(worker *persistence.Worker) (pb.WorkerClient, error) {
	return m.clientManager.GetClient(worker)
}

func (m *workerManager) isWorkerHealthy(ctx context.Context, worker *persistence.Worker) bool {
	workerGRPCClient, err := m.clientManager.GetClient(worker)
	if err != nil {
		log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to create grpc connection to worker")
		m.DeactivateWorker(worker.ID)
		return false
	}

	if _, err = workerGRPCClient.HealthCheck(ctx, &emptypb.Empty{}); err != nil {
		log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to perform health check")
		m.DeactivateWorker(worker.ID)
		return false
	}

	log.Debug().Str("worker_id", worker.ID).Msg("Worker is healthy")
	return true
}
