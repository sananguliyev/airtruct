package coordinator

import (
	"github.com/sananguliyev/airtruct/internal/analytics"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/ratelimiter"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type StreamWorkerMap interface {
	SetStreamWorker(streamID int64, workerID string, workerStreamID int64)
	RemoveStream(streamID int64)
	RemoveStreamIfMatches(streamID int64, workerStreamID int64)
}

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
	analyticsProvider   analytics.Provider
	streamWorkerMap     StreamWorkerMap
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
	analyticsProvider analytics.Provider,
	streamWorkerMap StreamWorkerMap,
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
		analyticsProvider:   analyticsProvider,
		streamWorkerMap:     streamWorkerMap,
	}
}
