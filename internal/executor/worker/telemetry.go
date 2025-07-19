package worker

import (
	"context"
	"io"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/warpstreamlabs/bento/public/service"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

type TelemetryManager interface {
	ShipLogs(ctx context.Context)
	ShipMetrics(ctx context.Context)
}

type telemetryManager struct {
	coordinatorConnection CoordinatorConnection
	streamManager         StreamManager
}

func NewTelemetryManager(coordinatorConnection CoordinatorConnection, streamManager StreamManager) TelemetryManager {
	return &telemetryManager{
		coordinatorConnection: coordinatorConnection,
		streamManager:         streamManager,
	}
}

func (t *telemetryManager) ShipLogs(ctx context.Context) {
	retryDelay := time.Second

	for {
		streamClient, err := t.coordinatorConnection.GetClient().IngestEvents(ctx)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create stream client")
			retryDelay *= 2
			time.Sleep(min(retryDelay, StreamMaxDelay))
			continue
		}
		retryDelay = time.Second

		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("ShipLogs context done, closing stream")
				if err := streamClient.CloseSend(); err != nil {
					log.Error().Err(err).Msg("Error closing send stream")
				}
				return
			default:
				sentEvents := 0
				streams := t.streamManager.GetAllStreams()

				for workerStreamID, stream := range streams {
					tracingSummary := stream.TracingSummary
					eventGetters := map[string]func(bool) map[string][]service.TracingEvent{
						string(persistence.StreamSectionInput):    tracingSummary.InputEvents,
						string(persistence.StreamSectionPipeline): tracingSummary.ProcessorEvents,
						string(persistence.StreamSectionOutput):   tracingSummary.OutputEvents,
					}

					for section, getEvents := range eventGetters {
						for componentLabel, events := range getEvents(true) {
							for _, event := range events {
								metaStruct, err := structpb.NewStruct(event.Meta)
								if err != nil {
									log.Error().
										Err(err).
										Int64("worker_stream_id", workerStreamID).
										Str("component_label", componentLabel).
										Str("event_type", string(event.Type)).
										Str("event_content", event.Content).
										Any("event_meta", event.Meta).
										Msg("Failed to convert meta field to pb struct")
									continue
								}

								if err := streamClient.Send(&pb.Event{
									WorkerStreamId: workerStreamID,
									ComponentLabel: componentLabel,
									Section:        section,
									Type:           string(event.Type),
									Content:        event.Content,
									Meta:           metaStruct,
								}); err != nil {
									log.Error().Err(err).Msg("Failed to send event, re-establishing stream")
									goto ReconnectStream
								}
								sentEvents++

								_, err = streamClient.Recv()
								if err == io.EOF {
									log.Info().Msg("Server closed the stream")
									goto ReconnectStream
								}
								if err != nil {
									log.Error().Err(err).Msg("Failed to receive acknowledgment, re-establishing stream")
									goto ReconnectStream
								}
							}
						}
					}
				}

				if sentEvents == 0 {
					time.Sleep(100 * time.Millisecond)
				}
			}
		}
	ReconnectStream:
		log.Info().Msg("Attempting to reconnect stream...")
		time.Sleep(retryDelay)
	}
}

func (t *telemetryManager) ShipMetrics(ctx context.Context) {
	streams := t.streamManager.GetAllStreams()

	for workerStreamID, stream := range streams {
		tracingSummary := stream.TracingSummary
		err := t.coordinatorConnection.IngestMetrics(
			ctx,
			workerStreamID,
			tracingSummary.TotalInput(),
			tracingSummary.TotalProcessorErrors(),
			tracingSummary.TotalOutput(),
		)
		if err != nil {
			log.Error().Err(err).Msg("Failed to send metrics")
		}
	}
}
