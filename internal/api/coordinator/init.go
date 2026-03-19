package coordinator

import (
	"github.com/sananguliyev/airtruct/internal/analytics"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/ratelimiter"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type FlowWorkerMap interface {
	SetFlowWorker(flowID int64, workerID string, workerFlowID int64)
	RemoveFlow(flowID int64)
	RemoveFlowIfMatches(flowID int64, workerFlowID int64)
}

type CoordinatorAPI struct {
	pb.UnimplementedCoordinatorServer
	eventRepo           persistence.EventRepository
	workerRepo          persistence.WorkerRepository
	flowRepo          persistence.FlowRepository
	flowCacheRepo     persistence.FlowCacheRepository
	flowRateLimitRepo persistence.FlowRateLimitRepository
	flowBufferRepo    persistence.FlowBufferRepository
	workerFlowRepo    persistence.WorkerFlowRepository
	secretRepo          persistence.SecretRepository
	cacheRepo           persistence.CacheRepository
	bufferRepo          persistence.BufferRepository
	rateLimitRepo       persistence.RateLimitRepository
	fileRepo            persistence.FileRepository
	rateLimiterEngine   *ratelimiter.Engine
	aesgcm              *vault.AESGCM
	analyticsProvider   analytics.Provider
	flowWorkerMap     FlowWorkerMap
}

func NewCoordinatorAPI(
	eventRepo persistence.EventRepository,
	flowRepo persistence.FlowRepository,
	flowCacheRepo persistence.FlowCacheRepository,
	flowRateLimitRepo persistence.FlowRateLimitRepository,
	flowBufferRepo persistence.FlowBufferRepository,
	workerRepo persistence.WorkerRepository,
	workerFlowRepo persistence.WorkerFlowRepository,
	secretRepo persistence.SecretRepository,
	cacheRepo persistence.CacheRepository,
	bufferRepo persistence.BufferRepository,
	rateLimitRepo persistence.RateLimitRepository,
	fileRepo persistence.FileRepository,
	rateLimiterEngine *ratelimiter.Engine,
	aesgcm *vault.AESGCM,
	analyticsProvider analytics.Provider,
	flowWorkerMap FlowWorkerMap,
) *CoordinatorAPI {
	return &CoordinatorAPI{
		eventRepo:           eventRepo,
		flowRepo:          flowRepo,
		flowCacheRepo:     flowCacheRepo,
		flowRateLimitRepo: flowRateLimitRepo,
		flowBufferRepo:    flowBufferRepo,
		workerRepo:          workerRepo,
		workerFlowRepo:    workerFlowRepo,
		secretRepo:          secretRepo,
		cacheRepo:           cacheRepo,
		bufferRepo:          bufferRepo,
		rateLimitRepo:       rateLimitRepo,
		fileRepo:            fileRepo,
		rateLimiterEngine:   rateLimiterEngine,
		aesgcm:              aesgcm,
		analyticsProvider:   analyticsProvider,
		flowWorkerMap:     flowWorkerMap,
	}
}
