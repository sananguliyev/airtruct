package coordinator

import (
	"context"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

func (c *CoordinatorAPI) UpdateWorkerStreamStatus(_ context.Context, in *pb.WorkerStreamStatusRequest) (*pb.CommonResponse, error) {
	var err error

	workerStream, err := c.workerStreamRepo.FindByID(in.GetWorkerStreamId())
	if err != nil {
		log.Error().Err(err).Int64("worker_stream_id", in.GetWorkerStreamId()).Msg("Failed to find worker stream")
		return nil, status.Error(codes.Internal, "Failed to find worker stream")
	} else if workerStream == nil {
		log.Error().Err(err).Int64("worker_stream_id", in.GetWorkerStreamId()).Msg("Worker stream not found")
		return nil, status.Error(codes.NotFound, "worker stream not found")
	}

	newStatus := persistence.WorkerStreamStatus(in.GetStatus().String())

	if err = c.workerStreamRepo.UpdateStatus(in.GetWorkerStreamId(), newStatus); err != nil {
		log.Error().Err(err).Str("target_status", string(newStatus)).Msg("Failed to update worker stream")
		return nil, status.Error(codes.Internal, "Failed to update worker stream status")
	}

	switch newStatus {
	case persistence.WorkerStreamStatusRunning:
		c.streamWorkerMap.SetStreamWorker(workerStream.StreamID, workerStream.WorkerID, workerStream.ID)
		if workerStream.Stream.ParentID != nil {
			c.streamWorkerMap.SetStreamWorker(*workerStream.Stream.ParentID, workerStream.WorkerID, workerStream.ID)
		}
	case persistence.WorkerStreamStatusFailed, persistence.WorkerStreamStatusStopped:
		c.streamWorkerMap.RemoveStreamIfMatches(workerStream.StreamID, workerStream.ID)
		if workerStream.Stream.ParentID != nil {
			c.streamWorkerMap.RemoveStreamIfMatches(*workerStream.Stream.ParentID, workerStream.ID)
		}
	case persistence.WorkerStreamStatusCompleted:
		c.streamWorkerMap.RemoveStreamIfMatches(workerStream.StreamID, workerStream.ID)
		if workerStream.Stream.ParentID != nil {
			c.streamWorkerMap.RemoveStreamIfMatches(*workerStream.Stream.ParentID, workerStream.ID)
		}
		if err = c.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusCompleted); err != nil {
			log.Error().Err(err).Str("target_status", string(persistence.StreamStatusCompleted)).Msg("Failed to update stream status")
			return nil, status.Error(codes.Internal, "Failed to update worker stream status")
		}
	}

	return &pb.CommonResponse{
		Message: "Worker Stream status has been updated successfully",
	}, nil
}
