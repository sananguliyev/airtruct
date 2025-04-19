package coordinator

import (
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorAPI struct {
	pb.UnimplementedCoordinatorServer
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
) *CoordinatorAPI {
	return &CoordinatorAPI{
		config:              config,
		workerRepo:          workerRepo,
		componentConfigRepo: componentConfigRepo,
		streamRepo:          streamRepo,
		workerStreamRepo:    workerStreamRepo,
	}
}
