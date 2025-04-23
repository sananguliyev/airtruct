package coordinator

import (
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorAPI struct {
	pb.UnimplementedCoordinatorServer
	componentConfigRepo persistence.ComponentConfigRepository
	config              *config.NodeConfig
	eventRepo           persistence.EventRepository
	workerRepo          persistence.WorkerRepository
	streamRepo          persistence.StreamRepository
	workerStreamRepo    persistence.WorkerStreamRepository
}

func NewCoordinatorAPI(
	config *config.NodeConfig,
	componentConfigRepo persistence.ComponentConfigRepository,
	eventRepo persistence.EventRepository,
	streamRepo persistence.StreamRepository,
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		config:              config,
		componentConfigRepo: componentConfigRepo,
		eventRepo:           eventRepo,
		streamRepo:          streamRepo,
		workerRepo:          workerRepo,
		workerStreamRepo:    workerStreamRepo,
	}
}
