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
	streamBufferRepo    persistence.StreamBufferRepository
	workerStreamRepo    persistence.WorkerStreamRepository
	secretRepo          persistence.SecretRepository
	cacheRepo           persistence.CacheRepository
	bufferRepo          persistence.BufferRepository
	rateLimitRepo       persistence.RateLimitRepository
	fileRepo            persistence.FileRepository
	rateLimiterEngine   *ratelimiter.Engine
	aesgcm              *vault.AESGCM
}

func NewCoordinatorAPI(
	eventRepo persistence.EventRepository,
	streamRepo persistence.StreamRepository,
	streamCacheRepo persistence.StreamCacheRepository,
	streamRateLimitRepo persistence.StreamRateLimitRepository,
	streamBufferRepo persistence.StreamBufferRepository,
	workerRepo persistence.WorkerRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	secretRepo persistence.SecretRepository,
	cacheRepo persistence.CacheRepository,
	bufferRepo persistence.BufferRepository,
	rateLimitRepo persistence.RateLimitRepository,
	fileRepo persistence.FileRepository,
	rateLimiterEngine *ratelimiter.Engine,
	aesgcm *vault.AESGCM,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		eventRepo:           eventRepo,
		streamRepo:          streamRepo,
		streamCacheRepo:     streamCacheRepo,
		streamRateLimitRepo: streamRateLimitRepo,
		streamBufferRepo:    streamBufferRepo,
		workerRepo:          workerRepo,
		workerStreamRepo:    workerStreamRepo,
		secretRepo:          secretRepo,
		cacheRepo:           cacheRepo,
		bufferRepo:          bufferRepo,
		rateLimitRepo:       rateLimitRepo,
		fileRepo:            fileRepo,
		rateLimiterEngine:   rateLimiterEngine,
		aesgcm:              aesgcm,
	}
}
