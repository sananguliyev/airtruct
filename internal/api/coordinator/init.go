package coordinator

import (
	"sync"
	"time"

	"github.com/sananguliyev/airtruct/internal/analytics"
	"github.com/sananguliyev/airtruct/internal/config"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/ratelimiter"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type settingsCache struct {
	mu           sync.RWMutex
	mcpProtected bool
	expiresAt    time.Time
}

type tokenUsageTracker struct {
	mu      sync.Mutex
	pending map[int64]time.Time
}

const settingsCacheTTL = 10 * time.Second

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
	settingRepo         persistence.SettingRepository
	apiTokenRepo        persistence.APITokenRepository
	rateLimiterEngine   *ratelimiter.Engine
	aesgcm              *vault.AESGCM
	analyticsProvider   analytics.Provider
	flowWorkerMap     FlowWorkerMap
	authType          config.AuthType
	cache             settingsCache
	tokenUsage        tokenUsageTracker
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
	settingRepo persistence.SettingRepository,
	apiTokenRepo persistence.APITokenRepository,
	rateLimiterEngine *ratelimiter.Engine,
	aesgcm *vault.AESGCM,
	analyticsProvider analytics.Provider,
	flowWorkerMap FlowWorkerMap,
	authType config.AuthType,
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
		settingRepo:         settingRepo,
		apiTokenRepo:        apiTokenRepo,
		rateLimiterEngine:   rateLimiterEngine,
		aesgcm:              aesgcm,
		analyticsProvider:   analyticsProvider,
		flowWorkerMap:     flowWorkerMap,
		authType:          authType,
		tokenUsage:        tokenUsageTracker{pending: make(map[int64]time.Time)},
	}
}
