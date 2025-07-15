package coordinator

import (
	"container/heap"
	"context"

	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
	"github.com/sananguliyev/airtruct/internal/utils"
)

type StreamAssigner interface {
	AssignStreams(ctx context.Context) error
}

type streamAssigner struct {
	workerManager    WorkerManager
	streamRepo       persistence.StreamRepository
	workerStreamRepo persistence.WorkerStreamRepository
	configBuilder    ConfigBuilder
	streamWorkerMap  StreamWorkerMap
}

func NewStreamAssigner(
	workerManager WorkerManager,
	streamRepo persistence.StreamRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
	configBuilder ConfigBuilder,
	streamWorkerMap StreamWorkerMap,
) StreamAssigner {
	return &streamAssigner{
		workerManager:    workerManager,
		streamRepo:       streamRepo,
		workerStreamRepo: workerStreamRepo,
		configBuilder:    configBuilder,
		streamWorkerMap:  streamWorkerMap,
	}
}

func (s *streamAssigner) AssignStreams(ctx context.Context) error {
	healthyWorkers, err := s.workerManager.GetHealthyWorkers(ctx)
	if err != nil {
		return err
	}

	workerHeap := &utils.WorkerHeap{}
	heap.Init(workerHeap)
	for _, worker := range healthyWorkers {
		heap.Push(workerHeap, worker)
	}

	streams, err := s.streamRepo.ListAllActiveAndNonAssigned()
	if err != nil {
		log.Error().Err(err).Msg("Failed to list all active and non-assigned streams")
		return err
	}

	if len(streams) > 0 && workerHeap.Len() == 0 {
		log.Warn().Int("waiting_stream_count", len(streams)).Msg("No active workers to assign streams")
		return nil
	}

	for _, stream := range streams {
		worker := heap.Pop(workerHeap).(persistence.Worker)
		err = s.assignStreamToWorker(ctx, worker, stream)
		if err != nil {
			log.Error().
				Err(err).
				Str("worker_id", worker.ID).
				Int64("stream_id", stream.ID).
				Msg("Failed to assign job")
		} else {
			log.Debug().
				Str("worker_id", worker.ID).
				Int64("stream_id", stream.ID).
				Msg("Assigned job to worker")
			worker.RunningStreamCount++
		}
		workerHeap.Push(worker)
	}

	return nil
}

func (s *streamAssigner) assignStreamToWorker(ctx context.Context, worker persistence.Worker, stream persistence.Stream) error {
	workerClient, err := s.workerManager.GetWorkerClient(&worker)
	if err != nil {
		log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to get worker grpc client")
		return err
	}

	configYAML, err := s.configBuilder.BuildStreamConfig(stream)
	if err != nil {
		return err
	}

	log.Debug().
		Str("worker_id", worker.ID).
		Int64("stream_id", stream.ID).
		Str("config", configYAML).
		Msg("Config for worker stream")

	workerStream, err := s.workerStreamRepo.Queue(worker.ID, stream.ID)
	if err != nil {
		return err
	}

	resp, err := workerClient.AssignStream(ctx, &pb.AssignStreamRequest{
		WorkerStreamId: workerStream.ID,
		Config:         configYAML,
	})
	if err != nil {
		if err := s.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusFailed); err != nil {
			log.Warn().Err(err).Int64("worker_stream_id", workerStream.ID).Msg("Failed to update worker stream status after failed assignment")
		}
		return err
	}

	s.streamWorkerMap.SetStreamWorker(stream.ID, worker.ID, workerStream.ID)
	if stream.ParentID != nil {
		s.streamWorkerMap.SetStreamWorker(*stream.ParentID, worker.ID, workerStream.ID)
	}

	log.Info().
		Str("worker_id", worker.ID).
		Int64("stream_id", stream.ID).
		Int64("worker_stream_id", workerStream.ID).
		Str("worker_stream_assign_response", resp.Message).
		Msg("Assigned job to worker")

	return nil
}
