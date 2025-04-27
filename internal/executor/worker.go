package executor

import (
	"context"
	"io"
	"os"
	"sync"
	"time"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/rs/zerolog/log"
	"github.com/warpstreamlabs/bento/public/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	MaxItemsInStreamQueue = 10
	StreamMaxDelay        = 30 * time.Second
)

type WorkerExecutor interface {
	JoinToCoordinator(context.Context) error
	LeaveCoordinator(context.Context) error
	AddStreamToQueue(ctx context.Context, workerStreamID int64, config string) error
	FetchWorkerStreamStatus(ctx context.Context, workerStreamID int64) (*persistence.WorkerStreamStatus, error)
	DeleteWorkerStream(ctx context.Context, workerStreamID int64) error
	ShipLogs(context.Context)
	ShipMetrics(context.Context)
	ConsumeStreamQueue(context.Context)
}

type streamQueueItem struct {
	workerStreamID int64
	config         string
}

type serviceStream struct {
	Stream *service.Stream
	Status persistence.WorkerStreamStatus
}

type workerExecutor struct {
	clientConn        *grpc.ClientConn
	coordinatorClient pb.CoordinatorClient
	mu                sync.Mutex
	streamQueue       chan streamQueueItem
	streamBuilder     *service.StreamBuilder
	streams           map[int64]*serviceStream
	tracingSummaries  map[int64]*service.TracingSummary
	grpcPort          uint32
	joined            bool
}

func NewWorkerExecutor(discoveryUri string, grpcPort uint32) WorkerExecutor {
	sb := service.NewStreamBuilder()
	sb.SetEngineVersion("1.0.0")

	grpcConn, err := grpc.NewClient(discoveryUri, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create grpc client")
	}

	coordinatorGRPCClient := pb.NewCoordinatorClient(grpcConn)

	return &workerExecutor{
		clientConn:        grpcConn,
		coordinatorClient: coordinatorGRPCClient,
		streamQueue:       make(chan streamQueueItem, MaxItemsInStreamQueue),
		streamBuilder:     sb,
		streams:           make(map[int64]*serviceStream),
		tracingSummaries:  make(map[int64]*service.TracingSummary),
		grpcPort:          grpcPort,
		joined:            false,
	}
}

func (e *workerExecutor) JoinToCoordinator(ctx context.Context) error {
	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	if e.joined {
		log.Debug().Str("worker_id", hostname).Msg("Worker already joined to coordinator")
		return nil
	}

	r, err := e.coordinatorClient.RegisterWorker(ctx, &pb.RegisterWorkerRequest{
		Id:   hostname,
		Port: e.grpcPort,
	})
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to register on coordinator")
	}

	e.joined = true
	log.Info().Str("worker_id", hostname).Msg(r.GetMessage())

	return nil
}

func (e *workerExecutor) LeaveCoordinator(ctx context.Context) error {
	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	resp, err := e.coordinatorClient.DeregisterWorker(ctx, &pb.DeregisterWorkerRequest{Id: hostname})
	if err != nil {
		return err
	}

	e.joined = false
	log.Info().Str("worker_id", hostname).Str("coordinator_response", resp.Message).Msg("Left coordinator")

	return nil
}

func (e *workerExecutor) AddStreamToQueue(ctx context.Context, workerStreamID int64, config string) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if stream, exists := e.streams[workerStreamID]; exists && stream != nil {
		log.Debug().Int64("worker_stream_id", workerStreamID).Msg("Stream already started")
		return nil
	}

	e.streamQueue <- streamQueueItem{
		workerStreamID: workerStreamID,
		config:         config,
	}

	log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream queued for processing")

	if err := e.updateWorkerStreamStatus(ctx, workerStreamID, persistence.WorkerStreamStatusWaiting); err != nil {
		log.Warn().
			Err(err).
			Int64("worker_stream_id", workerStreamID).
			Str("status", string(persistence.WorkerStreamStatusWaiting)).
			Msg("Failed to update worker stream status")
	}

	return nil
}

func (e *workerExecutor) DeleteWorkerStream(ctx context.Context, workerStreamID int64) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if stream, exists := e.streams[workerStreamID]; exists && stream != nil {
		if err := stream.Stream.Stop(ctx); err != nil {
			log.Error().Err(err).Int64("worker_stream_id", workerStreamID).Msg("Failed to stop stream in worker")
			return err
		}

		e.ShipMetrics(ctx)
		delete(e.streams, workerStreamID)
		delete(e.tracingSummaries, workerStreamID)

		log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream deleted")
	} else {
		log.Debug().Int64("worker_stream_id", workerStreamID).Msg("Stream not found")
	}

	return nil
}

func (e *workerExecutor) FetchWorkerStreamStatus(_ context.Context, workerStreamID int64) (*persistence.WorkerStreamStatus, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if stream, exists := e.streams[workerStreamID]; exists && stream != nil {
		return &stream.Status, nil
	}

	return nil, nil
}

func (e *workerExecutor) ShipLogs(ctx context.Context) {
	retryDelay := time.Second

	for {
		streamClient, err := e.coordinatorClient.IngestEvents(ctx)
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
				e.mu.Lock()
				sentEvents := 0
				for workerStreamId, tracingSummary := range e.tracingSummaries {
					for componentName, events := range tracingSummary.InputEvents(true) {
						for _, event := range events {
							metaStruct, err := structpb.NewStruct(event.Meta)
							if err != nil {
								log.Error().
									Err(err).
									Int64("worker_stream_id", workerStreamId).
									Str("component_name", componentName).
									Str("event_type", string(event.Type)).
									Str("event_content", event.Content).
									Any("event_meta", event.Meta).
									Msg("Failed to convert meta field to pb struct")
								continue
							}
							if err := streamClient.Send(&pb.Event{
								WorkerStreamId: workerStreamId,
								ComponentName:  componentName,
								Section:        string(persistence.ComponentSectionInput),
								Type:           string(event.Type),
								Content:        event.Content,
								Meta:           metaStruct,
							}); err != nil {
								log.Error().Err(err).Msg("Failed to send event, re-establishing stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
							sentEvents++

							_, err = streamClient.Recv()
							if err == io.EOF {
								log.Info().Msg("Server closed the stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
							if err != nil {
								log.Error().Err(err).Msg("Failed to receive acknowledgment, re-establishing stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
						}
					}
					for componentName, events := range tracingSummary.ProcessorEvents(true) {
						for _, event := range events {
							metaStruct, err := structpb.NewStruct(event.Meta)
							if err != nil {
								log.Error().
									Err(err).
									Int64("worker_stream_id", workerStreamId).
									Str("component_name", componentName).
									Str("event_type", string(event.Type)).
									Str("event_content", event.Content).
									Any("event_meta", event.Meta).
									Msg("Failed to convert meta field to pb struct")
								continue
							}
							if err := streamClient.Send(&pb.Event{
								WorkerStreamId: workerStreamId,
								ComponentName:  componentName,
								Section:        string(persistence.ComponentSectionPipeline),
								Type:           string(event.Type),
								Content:        event.Content,
								Meta:           metaStruct,
							}); err != nil {
								log.Error().Err(err).Msg("Failed to send event, re-establishing stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
							sentEvents++

							_, err = streamClient.Recv()
							if err == io.EOF {
								log.Info().Msg("Server closed the stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
							if err != nil {
								log.Error().Err(err).Msg("Failed to receive acknowledgment, re-establishing stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
						}
					}
					for componentName, events := range tracingSummary.OutputEvents(true) {
						for _, event := range events {
							metaStruct, err := structpb.NewStruct(event.Meta)
							if err != nil {
								log.Error().
									Err(err).
									Int64("worker_stream_id", workerStreamId).
									Str("component_name", componentName).
									Str("event_type", string(event.Type)).
									Str("event_content", event.Content).
									Any("event_meta", event.Meta).
									Msg("Failed to convert meta field to pb struct")
								continue
							}
							if err := streamClient.Send(&pb.Event{
								WorkerStreamId: workerStreamId,
								ComponentName:  componentName,
								Section:        string(persistence.ComponentSectionOutput),
								Type:           string(event.Type),
								Content:        event.Content,
								Meta:           metaStruct,
							}); err != nil {
								log.Error().Err(err).Msg("Failed to send event, re-establishing stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
							sentEvents++

							_, err = streamClient.Recv()
							if err == io.EOF {
								log.Info().Msg("Server closed the stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
							if err != nil {
								log.Error().Err(err).Msg("Failed to receive acknowledgment, re-establishing stream")
								e.mu.Unlock()
								goto ReconnectStream
							}
						}
					}
				}
				e.mu.Unlock()

				if sentEvents == 0 {
					time.Sleep(100 * time.Millisecond) // Avoid busy-waiting if no events to send
				}
			}
		}
	ReconnectStream:
		log.Info().Msg("Attempting to reconnect stream...")
		time.Sleep(retryDelay)
	}
}

func (e *workerExecutor) ShipMetrics(ctx context.Context) {
	for workerStreamID, tracingSummary := range e.tracingSummaries {
		_, err := e.coordinatorClient.IngestMetrics(ctx, &pb.MetricsRequest{
			WorkerStreamId:  workerStreamID,
			InputEvents:     tracingSummary.TotalInput(),
			ProcessorErrors: tracingSummary.TotalProcessorErrors(),
			OutputEvents:    tracingSummary.TotalOutput(),
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to send metrics")
		}
	}
}

func (e *workerExecutor) ConsumeStreamQueue(ctx context.Context) {
	var err error

	for {
		select {
		case msg := <-e.streamQueue:
			e.mu.Lock()
			if stream, exists := e.streams[msg.workerStreamID]; exists && stream != nil {
				log.Debug().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream already started")
				e.mu.Unlock()
				continue
			}

			log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Processing stream")
			if err = e.streamBuilder.SetYAML(msg.config); err != nil {
				log.Error().Err(err).Msg("Failed to set stream YAML")
				e.mu.Unlock()
				continue
			}

			stream, tracingSummary, err := e.streamBuilder.BuildTraced()
			if err != nil {
				log.Error().Err(err).Msg("Failed to build stream")
				e.mu.Unlock()
				continue
			}

			e.streams[msg.workerStreamID] = &serviceStream{
				Stream: stream,
				Status: persistence.WorkerStreamStatusRunning,
			}
			e.tracingSummaries[msg.workerStreamID] = tracingSummary
			e.mu.Unlock()
			log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Starting stream")

			go func() {
				if err = stream.Run(ctx); err != nil {
					log.Error().Err(err).Msg("Failed to run stream")
					e.mu.Lock()
					delete(e.streams, msg.workerStreamID)
					delete(e.tracingSummaries, msg.workerStreamID)
					e.mu.Unlock()

					if err = e.updateWorkerStreamStatus(ctx, msg.workerStreamID, persistence.WorkerStreamStatusFailed); err != nil {
						log.Warn().
							Err(err).
							Int64("worker_stream_id", msg.workerStreamID).
							Str("status", string(persistence.WorkerStreamStatusFailed)).
							Msg("Failed to update worker stream status")
					}
				}
				log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream has been completed")
				if err = e.updateWorkerStreamStatus(ctx, msg.workerStreamID, persistence.WorkerStreamStatusCompleted); err != nil {
					log.Warn().
						Err(err).
						Int64("worker_stream_id", msg.workerStreamID).
						Str("status", string(persistence.WorkerStreamStatusFailed)).
						Msg("Failed to update worker stream status")
				}
			}()

			log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream started running")
			if err = e.updateWorkerStreamStatus(ctx, msg.workerStreamID, persistence.WorkerStreamStatusRunning); err != nil {
				log.Warn().
					Err(err).
					Int64("worker_stream_id", msg.workerStreamID).
					Str("status", string(persistence.WorkerStreamStatusRunning)).
					Msg("Failed to update worker stream status")
			}
		case <-ctx.Done():
			log.Info().Msg("Stopping streams...")
			e.mu.Lock()
			for workerStreamID, stream := range e.streams {
				if err := stream.Stream.Stop(ctx); err != nil {
					log.Error().Err(err).Int64("worker_stream_id", workerStreamID).Msg("Failed to stop stream in worker")
				}
			}
			e.streams = make(map[int64]*serviceStream)
			e.tracingSummaries = make(map[int64]*service.TracingSummary)
			e.mu.Unlock()
			log.Info().Msg("Streams have been stopped")
			return
		}
	}
}

func (e *workerExecutor) updateWorkerStreamStatus(ctx context.Context, workerStreamID int64, status persistence.WorkerStreamStatus) error {
	resp, err := e.coordinatorClient.UpdateWorkerStreamStatus(
		ctx,
		&pb.WorkerStreamStatusRequest{
			WorkerStreamId: workerStreamID,
			Status:         pb.WorkerStreamStatus(pb.WorkerStreamStatus_value[string(status)]),
		},
	)
	if err != nil {
		return err
	}

	log.Info().
		Int64("worker_stream_id", workerStreamID).
		Str("coordinator_response", resp.Message).
		Msg("Updated worker stream status")

	return nil
}
