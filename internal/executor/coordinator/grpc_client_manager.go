package coordinator

import (
	"sync"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

type GRPCClientManager interface {
	GetClient(worker *persistence.Worker) (pb.WorkerClient, error)
	RemoveClient(workerID string)
}

type grpcClientManager struct {
	mu            sync.Mutex
	workerClients map[string]pb.WorkerClient
}

func NewGRPCClientManager() GRPCClientManager {
	return &grpcClientManager{
		workerClients: make(map[string]pb.WorkerClient),
	}
}

func (m *grpcClientManager) GetClient(worker *persistence.Worker) (pb.WorkerClient, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if client, exists := m.workerClients[worker.ID]; exists {
		return client, nil
	}

	log.Debug().Str("worker_id", worker.ID).Msg("Creating new grpc client for worker")
	grpcConn, err := grpc.NewClient(worker.Address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := pb.NewWorkerClient(grpcConn)
	m.workerClients[worker.ID] = client

	return client, nil
}

func (m *grpcClientManager) RemoveClient(workerID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.workerClients, workerID)
	log.Debug().Str("worker_id", workerID).Msg("Removed grpc client for worker")
}
