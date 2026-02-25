package coordinator

import (
	"context"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorExecutor interface {
	CheckWorkersAndAssignStreams(context.Context) error
	CheckWorkerHeartbeats(context.Context) error
	CheckStreamLeases(context.Context) error
	ForwardRequestToWorker(context.Context, *http.Request) (int32, []byte, error)
}

type coordinatorExecutor struct {
	streamAssigner   StreamAssigner
	requestForwarder RequestForwarder
	streamWorkerMap  StreamWorkerMap
	workerStreamRepo persistence.WorkerStreamRepository
	workerRepo       persistence.WorkerRepository
}

func NewCoordinatorExecutor(
	workerRepo persistence.WorkerRepository,
	streamRepo persistence.StreamRepository,
	streamCacheRepo persistence.StreamCacheRepository,
	streamRateLimitRepo persistence.StreamRateLimitRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	fileRepo persistence.FileRepository,
) CoordinatorExecutor {
	clientManager := NewGRPCClientManager()
	workerManager := NewWorkerManager(workerRepo, workerStreamRepo, clientManager)
	configBuilder := NewConfigBuilder(streamCacheRepo, streamRateLimitRepo, fileRepo)
	streamWorkerMap := NewStreamWorkerMap()

	err := initializeStreamWorkerMapping(workerStreamRepo, streamWorkerMap)
	if err != nil {
		log.Error().Err(err).Msg("Failed to initialize stream-worker mapping")
	}

	streamAssigner := NewStreamAssigner(workerManager, streamRepo, workerStreamRepo, configBuilder, streamWorkerMap)
	requestForwarder := NewRequestForwarder(workerManager, streamWorkerMap, streamRepo)

	return &coordinatorExecutor{
		streamAssigner:   streamAssigner,
		requestForwarder: requestForwarder,
		streamWorkerMap:  streamWorkerMap,
		workerStreamRepo: workerStreamRepo,
		workerRepo:       workerRepo,
	}
}

func (e *coordinatorExecutor) CheckWorkersAndAssignStreams(ctx context.Context) error {
	return e.streamAssigner.AssignStreams(ctx)
}

func (e *coordinatorExecutor) CheckWorkerHeartbeats(ctx context.Context) error {
	workers, err := e.workerRepo.FindActiveWithStaleHeartbeat()
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch workers with stale heartbeats")
		return err
	}

	for _, worker := range workers {
		timeSinceHeartbeat := time.Since(worker.LastHeartbeat)

		log.Warn().
			Str("worker_id", worker.ID).
			Dur("time_since_heartbeat", timeSinceHeartbeat).
			Msg("Worker heartbeat timeout - marking as inactive")

		err := e.workerRepo.Deactivate(worker.ID)
		if err != nil {
			log.Error().
				Err(err).
				Str("worker_id", worker.ID).
				Msg("Failed to deactivate worker")
			continue
		}

		err = e.workerStreamRepo.StopAllRunningAndWaitingByWorkerID(worker.ID)
		if err != nil {
			log.Error().
				Err(err).
				Str("worker_id", worker.ID).
				Msg("Failed to stop worker streams")
			continue
		}

		log.Info().
			Str("worker_id", worker.ID).
			Msg("Worker marked as inactive due to heartbeat timeout")
	}

	return nil
}

func (e *coordinatorExecutor) CheckStreamLeases(ctx context.Context) error {
	expiredStreams, err := e.workerStreamRepo.FindRunningWithExpiredLeases()
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch streams with expired leases")
		return err
	}

	for _, workerStream := range expiredStreams {
		timeSinceExpiry := time.Since(workerStream.LeaseExpiresAt)

		log.Warn().
			Str("worker_id", workerStream.WorkerID).
			Int64("stream_id", workerStream.StreamID).
			Int64("worker_stream_id", workerStream.ID).
			Dur("time_since_expiry", timeSinceExpiry).
			Msg("Stream lease expired - marking as stopped")

		err := e.workerStreamRepo.UpdateStatus(
			workerStream.ID,
			persistence.WorkerStreamStatusStopped,
		)
		if err != nil {
			log.Error().
				Err(err).
				Int64("worker_stream_id", workerStream.ID).
				Msg("Failed to mark expired stream as stopped")
			continue
		}

		log.Info().
			Str("worker_id", workerStream.WorkerID).
			Int64("stream_id", workerStream.StreamID).
			Msg("Expired stream marked as stopped - available for reassignment")
	}

	return nil
}

func (e *coordinatorExecutor) ForwardRequestToWorker(ctx context.Context, r *http.Request) (int32, []byte, error) {
	return e.requestForwarder.ForwardRequestToWorker(ctx, r)
}

func initializeStreamWorkerMapping(workerStreamRepo persistence.WorkerStreamRepository, streamWorkerMap StreamWorkerMap) error {
	workerStreams, err := workerStreamRepo.ListAllByStatuses(persistence.WorkerStreamStatusRunning)
	if err != nil {
		log.Error().Err(err).Msg("Failed to list all running worker streams, suggesting to restart the coordinator, otherwise HTTP streams will not be reachable")
		return err
	}

	for _, workerStream := range workerStreams {
		streamWorkerMap.SetStreamWorker(workerStream.StreamID, workerStream.Worker.ID, workerStream.ID)
		if workerStream.Stream.ParentID != nil {
			streamWorkerMap.SetStreamWorker(*workerStream.Stream.ParentID, workerStream.Worker.ID, workerStream.ID)
		}
	}

	log.Info().Int("running_worker_stream_count", len(workerStreams)).Msg("Loaded running worker streams")
	return nil
}
