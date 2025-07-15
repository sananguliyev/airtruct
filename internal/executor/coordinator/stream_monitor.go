package coordinator

import (
	"context"

	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

type StreamMonitor interface {
	CheckWorkerStreams(ctx context.Context) error
}

type streamMonitor struct {
	workerManager    WorkerManager
	streamRepo       persistence.StreamRepository
	workerStreamRepo persistence.WorkerStreamRepository
}

func NewStreamMonitor(
	workerManager WorkerManager,
	streamRepo persistence.StreamRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) StreamMonitor {
	return &streamMonitor{
		workerManager:    workerManager,
		streamRepo:       streamRepo,
		workerStreamRepo: workerStreamRepo,
	}
}

func (m *streamMonitor) CheckWorkerStreams(ctx context.Context) error {
	workerStreams, err := m.workerStreamRepo.ListAllByStatuses(
		persistence.WorkerStreamStatusRunning,
		persistence.WorkerStreamStatusWaiting,
	)
	if err != nil {
		return err
	}

	log.Debug().Int("running_worker_stream_count", len(workerStreams)).Msg("Checking worker streams")

	for _, workerStream := range workerStreams {
		workerGRPCClient, err := m.workerManager.GetWorkerClient(&workerStream.Worker)
		if err != nil {
			log.Error().Err(err).Int64("worker_stream_id", workerStream.ID).Msg("Failed to get worker grpc client")
			if err := m.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusStopped); err != nil {
				log.Error().
					Err(err).
					Str("worker_id", workerStream.Worker.ID).
					Int64("worker_stream_id", workerStream.ID).
					Int64("stream_id", workerStream.StreamID).
					Msg("Failed to make GRPC connection to worker")
			}
			continue
		}

		if workerStream.Stream.IsCurrent {
			m.checkStream(ctx, workerGRPCClient, &workerStream)
		} else {
			m.completeStream(ctx, workerGRPCClient, &workerStream)
		}
	}

	return nil
}

func (m *streamMonitor) checkStream(ctx context.Context, workerClient pb.WorkerClient, workerStream *persistence.WorkerStream) {
	resp, err := workerClient.FetchStream(ctx, &pb.FetchStreamRequest{WorkerStreamId: workerStream.ID})
	if err != nil {
		log.Error().
			Err(err).
			Str("process", "check").
			Str("worker_id", workerStream.Worker.ID).
			Int64("worker_stream_id", workerStream.ID).
			Int64("stream_id", workerStream.StreamID).
			Msg("failed to perform stream check")

		if err := m.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusStopped); err != nil {
			log.Error().
				Err(err).
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int64("worker_stream_id", workerStream.ID).
				Int64("stream_id", workerStream.StreamID).
				Msg("Failed to update worker stream status")
		}
		return
	}

	log.Debug().Int64("worker_stream_id", workerStream.ID).Str("status", resp.Status.String()).Msg("Worker stream checked")

	switch resp.Status.String() {
	case string(persistence.WorkerStreamStatusCompleted):
		m.handleCompletedStream(workerStream)
	case string(persistence.WorkerStreamStatusFailed):
		m.handleFailedStream(workerStream)
	default:
		log.Debug().
			Str("process", "check").
			Str("worker_id", workerStream.Worker.ID).
			Int64("worker_stream_id", workerStream.ID).
			Int64("stream_id", workerStream.StreamID).
			Msg("Worker stream is still running")
	}
}

func (m *streamMonitor) completeStream(ctx context.Context, workerClient pb.WorkerClient, workerStream *persistence.WorkerStream) {
	resp, err := workerClient.CompleteStream(ctx, &pb.CompleteStreamRequest{WorkerStreamId: workerStream.ID})
	if err != nil {
		if err := m.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusCompleted); err != nil {
			log.Error().
				Err(err).
				Str("process", "delete").
				Str("worker_id", workerStream.Worker.ID).
				Int64("worker_stream_id", workerStream.ID).
				Int64("stream_id", workerStream.StreamID).
				Msg("Failed to update worker stream status")
		}
		return
	}

	log.Info().
		Str("process", "delete").
		Str("worker_id", workerStream.Worker.ID).
		Int64("worker_stream_id", workerStream.ID).
		Str("worker_stream_complete_response", resp.Message).
		Msg("Worker stream has been completed")
}

func (m *streamMonitor) handleCompletedStream(workerStream *persistence.WorkerStream) {
	if err := m.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusCompleted); err != nil {
		log.Error().
			Err(err).
			Str("process", "check").
			Str("worker_id", workerStream.Worker.ID).
			Int64("worker_stream_id", workerStream.ID).
			Int64("stream_id", workerStream.StreamID).
			Msg("Failed to stop worker stream")
		return
	}

	if err := m.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusCompleted); err != nil {
		log.Error().
			Str("process", "check").
			Err(err).Int64("worker_stream_id", workerStream.ID).
			Msg("Failed to stop worker stream")
		return
	}

	log.Info().
		Str("process", "check").
		Str("worker_id", workerStream.Worker.ID).
		Int64("worker_stream_id", workerStream.ID).
		Int64("stream_id", workerStream.StreamID).
		Msg("Worker stream has been completed job")
}

func (m *streamMonitor) handleFailedStream(workerStream *persistence.WorkerStream) {
	if err := m.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusFailed); err != nil {
		log.Error().
			Err(err).
			Str("process", "check").
			Str("worker_id", workerStream.Worker.ID).
			Int64("worker_stream_id", workerStream.ID).
			Int64("stream_id", workerStream.StreamID).
			Msg("Failed to stop worker stream")
		return
	}

	if err := m.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusFailed); err != nil {
		log.Error().
			Err(err).
			Str("process", "check").
			Str("worker_id", workerStream.Worker.ID).
			Int64("worker_stream_id", workerStream.ID).
			Int64("stream_id", workerStream.StreamID).
			Msg("Failed to stop worker stream")
		return
	}

	log.Info().
		Str("process", "check").
		Str("worker_id", workerStream.Worker.ID).
		Int64("worker_stream_id", workerStream.ID).
		Int64("stream_id", workerStream.StreamID).
		Msg("Worker stream has been failed")
}
