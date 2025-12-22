package coordinator

import (
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/ratelimiter"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type CoordinatorAPI struct {
	pb.UnimplementedCoordinatorServer
	eventRepo           persistence.EventRepository
	workerRepo          persistence.WorkerRepository
	streamRepo          persistence.StreamRepository
	streamCacheRepo     persistence.StreamCacheRepository
	streamRateLimitRepo persistence.StreamRateLimitRepository
	workerStreamRepo    persistence.WorkerStreamRepository
	secretRepo          persistence.SecretRepository
	cacheRepo           persistence.CacheRepository
	rateLimitRepo       persistence.RateLimitRepository
	rateLimiterEngine   *ratelimiter.Engine
	aesgcm              *vault.AESGCM
}

func NewCoordinatorAPI(
	eventRepo persistence.EventRepository,
	streamRepo persistence.StreamRepository,
	streamCacheRepo persistence.StreamCacheRepository,
	streamRateLimitRepo persistence.StreamRateLimitRepository,
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	secretRepo persistence.SecretRepository,
	cacheRepo persistence.CacheRepository,
	rateLimitRepo persistence.RateLimitRepository,
	rateLimiterEngine *ratelimiter.Engine,
	aesgcm *vault.AESGCM,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		eventRepo:           eventRepo,
		streamRepo:          streamRepo,
		streamCacheRepo:     streamCacheRepo,
		streamRateLimitRepo: streamRateLimitRepo,
		workerRepo:          workerRepo,
		workerStreamRepo:    workerStreamRepo,
		secretRepo:          secretRepo,
		cacheRepo:           cacheRepo,
		rateLimitRepo:       rateLimitRepo,
		rateLimiterEngine:   rateLimiterEngine,
		aesgcm:              aesgcm,
	}
}
