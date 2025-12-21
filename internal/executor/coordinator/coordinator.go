package coordinator

import (
	"context"
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorExecutor interface {
	CheckWorkersAndAssignStreams(context.Context) error
	CheckWorkerStreams(context.Context) error
	ForwardRequestToWorker(context.Context, *http.Request) (int32, []byte, error)
}

type coordinatorExecutor struct {
	streamAssigner   StreamAssigner
	streamMonitor    StreamMonitor
	requestForwarder RequestForwarder
	streamWorkerMap  StreamWorkerMap
}

func NewCoordinatorExecutor(
	workerRepo persistence.WorkerRepository,
	streamRepo persistence.StreamRepository,
	streamCacheRepo persistence.StreamCacheRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) CoordinatorExecutor {
	clientManager := NewGRPCClientManager()
	workerManager := NewWorkerManager(workerRepo, workerStreamRepo, clientManager)
	configBuilder := NewConfigBuilder(streamCacheRepo)
	streamWorkerMap := NewStreamWorkerMap()

	err := initializeStreamWorkerMapping(workerStreamRepo, streamWorkerMap)
	if err != nil {
		log.Error().Err(err).Msg("Failed to initialize stream-worker mapping")
	}

	streamAssigner := NewStreamAssigner(workerManager, streamRepo, workerStreamRepo, configBuilder, streamWorkerMap)
	streamMonitor := NewStreamMonitor(workerManager, streamRepo, workerStreamRepo)
	requestForwarder := NewRequestForwarder(workerManager, streamWorkerMap)

	return &coordinatorExecutor{
		streamAssigner:   streamAssigner,
		streamMonitor:    streamMonitor,
		requestForwarder: requestForwarder,
		streamWorkerMap:  streamWorkerMap,
	}
}

func (e *coordinatorExecutor) CheckWorkersAndAssignStreams(ctx context.Context) error {
	return e.streamAssigner.AssignStreams(ctx)
}

func (e *coordinatorExecutor) CheckWorkerStreams(ctx context.Context) error {
	return e.streamMonitor.CheckWorkerStreams(ctx)
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
