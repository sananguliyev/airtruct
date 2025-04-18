package coordinator

import (
	"context"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protorender"
)

func (c *CoordinatorAPI) UpdateWorkerStreamStatus(_ context.Context, in *pb.WorkerStreamStatusRequest) (*pb.WorkerStreamStatusResponse, error) {
	var err error

	workerStream, err := c.workerStreamRepo.FindByID(in.GetWorkerStreamId())
	if err != nil {
		log.Error().Err(err).Int64("worker_stream_id", in.GetWorkerStreamId()).Msg("Failed to find worker stream")
		return nil, status.Error(codes.Internal, "Failed to find worker stream")
	} else if workerStream == nil {
		log.Error().Err(err).Int64("worker_stream_id", in.GetWorkerStreamId()).Msg("Worker stream not found")
		return nil, status.Error(codes.NotFound, "worker stream not found")
	}

	if err = c.workerStreamRepo.UpdateStatus(in.GetWorkerStreamId(), persistence.WorkerStreamStatus(in.GetStatus().String())); err != nil {
		log.Error().Err(err).Str("target_status", string(persistence.StreamStatusCompleted)).Msg("Failed to update worker stream")
		return nil, status.Error(codes.Internal, "Failed to update worker stream status")
	}

	if persistence.WorkerStreamStatus(in.GetStatus().String()) == persistence.WorkerStreamStatusCompleted {
		if err = c.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusCompleted); err != nil {
			log.Error().Err(err).Str("target_status", string(persistence.StreamStatusCompleted)).Msg("Failed to update worker stream")
			return nil, status.Error(codes.Internal, "Failed to update worker stream status")
		}
	}

	return &pb.WorkerStreamStatusResponse{
		Message: "Worker Stream status has been updated successfully",
	}, nil
}
