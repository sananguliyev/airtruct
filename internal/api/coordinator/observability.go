package coordinator

import (
	"context"
	"io"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (c *CoordinatorAPI) IngestEvents(stream grpc.BidiStreamingServer[pb.Event, emptypb.Empty]) error {
	for {
		event, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return status.Errorf(codes.Internal, "failed to receive event: %v", err)
		}

		meta, err := event.GetMeta().MarshalJSON()
		if err != nil {
			return status.Errorf(codes.InvalidArgument, "invalid event format: %v", err)
		}

		evetEntity := &persistence.Event{
			WorkerStreamID: event.GetWorkerStreamId(),
			Section:        event.GetSection(),
			ComponentLabel: event.GetComponentLabel(),
			Type:           persistence.EventType(event.GetType()),
			Meta:           meta,
			Content:        event.GetContent(),
		}
		if err = c.eventRepo.AddEvent(evetEntity); err != nil {
			return status.Error(codes.InvalidArgument, "invalid event format")
		}

		if err = stream.Send(&emptypb.Empty{}); err != nil {
			log.Error().Err(err).Msg("failed to ack event")
			return status.Error(codes.Internal, "failed to ack event")
		}
	}
}

func (c *CoordinatorAPI) IngestMetrics(ctx context.Context, in *pb.MetricsRequest) (*emptypb.Empty, error) {
	var err error

	if err = in.Validate(); err != nil {
		log.Error().Err(err).Msg("failed to validate metrics request")
		return nil, status.Error(codes.InvalidArgument, "invalid metrics request")
	}

	err = c.workerStreamRepo.UpdateMetrics(
		in.GetWorkerStreamId(),
		in.GetInputEvents(),
		in.GetProcessorErrors(),
		in.GetOutputEvents(),
	)
	if err != nil {
		log.Error().Err(err).Msg("failed to update metrics")
		return nil, status.Error(codes.Internal, "failed to update metrics")
	}

	return &emptypb.Empty{}, nil
}
