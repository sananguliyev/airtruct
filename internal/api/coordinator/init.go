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
	streamCacheRepo  persistence.StreamCacheRepository
	workerStreamRepo persistence.WorkerStreamRepository
	secretRepo       persistence.SecretRepository
	cacheRepo        persistence.CacheRepository
	aesgcm           *vault.AESGCM
}

func NewCoordinatorAPI(
	eventRepo persistence.EventRepository,
	streamRepo persistence.StreamRepository,
	streamCacheRepo persistence.StreamCacheRepository,
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	secretRepo persistence.SecretRepository,
	cacheRepo persistence.CacheRepository,
	aesgcm *vault.AESGCM,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		eventRepo:        eventRepo,
		streamRepo:       streamRepo,
		streamCacheRepo:  streamCacheRepo,
		workerRepo:       workerRepo,
		workerStreamRepo: workerStreamRepo,
		secretRepo:       secretRepo,
		cacheRepo:        cacheRepo,
		aesgcm:           aesgcm,
	}
}
