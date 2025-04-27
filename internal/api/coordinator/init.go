package coordinator

import (
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorAPI struct {
	pb.UnimplementedCoordinatorServer
	componentConfigRepo persistence.ComponentConfigRepository
	eventRepo           persistence.EventRepository
	workerRepo          persistence.WorkerRepository
	streamRepo          persistence.StreamRepository
	workerStreamRepo    persistence.WorkerStreamRepository
}

func NewCoordinatorAPI(
	componentConfigRepo persistence.ComponentConfigRepository,
	eventRepo persistence.EventRepository,
	streamRepo persistence.StreamRepository,
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		componentConfigRepo: componentConfigRepo,
		eventRepo:           eventRepo,
		streamRepo:          streamRepo,
		workerRepo:          workerRepo,
		workerStreamRepo:    workerStreamRepo,
	}
}
