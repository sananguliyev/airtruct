package coordinator

import (
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type CoordinatorAPI struct {
	pb.UnimplementedCoordinatorServer
	eventRepo        persistence.EventRepository
	workerRepo       persistence.WorkerRepository
	streamRepo       persistence.StreamRepository
	workerStreamRepo persistence.WorkerStreamRepository
	secretRepo       persistence.SecretRepository
	aesgcm           *vault.AESGCM
}

func NewCoordinatorAPI(
	eventRepo persistence.EventRepository,
	streamRepo persistence.StreamRepository,
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	secretRepo persistence.SecretRepository,
	aesgcm *vault.AESGCM,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		eventRepo:        eventRepo,
		streamRepo:       streamRepo,
		workerRepo:       workerRepo,
		workerStreamRepo: workerStreamRepo,
		secretRepo:       secretRepo,
		aesgcm:           aesgcm,
	}
}
