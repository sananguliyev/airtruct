package coordinator

import (
	"io"

	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
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
			ComponentName:  event.GetComponentName(),
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
