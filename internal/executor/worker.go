package executor

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"time"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/rs/zerolog/log"
	"github.com/warpstreamlabs/bento/public/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	MaxItemsInStreamQueue = 10
	StreamMaxDelay        = 30 * time.Second
)

type IngestResult struct {
	StatusCode int
	Response   []byte
}

type WorkerExecutor interface {
	JoinToCoordinator(context.Context) error
	LeaveCoordinator(context.Context) error
	AddStreamToQueue(ctx context.Context, workerStreamID int64, config string) error
	FetchWorkerStreamStatus(ctx context.Context, workerStreamID int64) (*persistence.WorkerStreamStatus, error)
	DeleteWorkerStream(ctx context.Context, workerStreamID int64) error
	ShipLogs(context.Context)
	ShipMetrics(context.Context)
	ConsumeStreamQueue(context.Context)
	IngestData(ctx context.Context, workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error)
}

type streamQueueItem struct {
	workerStreamID int64
	config         string
}

type serviceStream struct {
	Stream         *service.Stream
	Cancel         context.CancelFunc
	Mux            *http.ServeMux
	Status         persistence.WorkerStreamStatus
	TracingSummary *service.TracingSummary
}

type workerExecutor struct {
	clientConn        *grpc.ClientConn
	coordinatorClient pb.CoordinatorClient
	mu                sync.Mutex
	streamQueue       chan streamQueueItem
	streams           map[int64]*serviceStream
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

	executor := &workerExecutor{
		clientConn:        grpcConn,
		coordinatorClient: coordinatorGRPCClient,
		streamQueue:       make(chan streamQueueItem, MaxItemsInStreamQueue),
		streams:           make(map[int64]*serviceStream),
		grpcPort:          grpcPort,
		joined:            false,
	}

	// Start a goroutine to continuously check gRPC connection status
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			state := grpcConn.GetState()
			if state == connectivity.TransientFailure || state == connectivity.Shutdown {
				log.Warn().Str("state", state.String()).Msg("gRPC connection is down")
				executor.mu.Lock()
				executor.joined = false
				executor.mu.Unlock()
			}
		}
	}()

	return executor
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
		log.Error().Err(err).Msg("Failed to register on coordinator")
		return err
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
		log.Info().Int64("worker_stream_id", workerStreamID).Msg("Canceling stream")
		stream.Cancel()

		e.ShipMetrics(ctx)
		delete(e.streams, workerStreamID)

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
				for workerStreamId, stream := range e.streams {
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
										Int64("worker_stream_id", workerStreamId).
										Str("component_label", componentLabel).
										Str("event_type", string(event.Type)).
										Str("event_content", event.Content).
										Any("event_meta", event.Meta).
										Msg("Failed to convert meta field to pb struct")
									continue
								}
								if err := streamClient.Send(&pb.Event{
									WorkerStreamId: workerStreamId,
									ComponentLabel: componentLabel,
									Section:        section,
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
	for workerStreamID, stream := range e.streams {
		tracingSummary := stream.TracingSummary
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
			streamBuilder := service.NewStreamBuilder()
			streamMux := http.NewServeMux()
			streamBuilder.SetHTTPMux(streamMux)
			if err = streamBuilder.SetYAML(msg.config); err != nil {
				log.Error().Err(err).Msg("Failed to set stream YAML")
				e.mu.Unlock()
				continue
			}

			stream, tracingSummary, err := streamBuilder.BuildTraced()
			if err != nil {
				log.Error().Err(err).Msg("Failed to build stream")
				e.mu.Unlock()
				continue
			}

			e.streams[msg.workerStreamID] = &serviceStream{
				Stream:         stream,
				Mux:            streamMux,
				Status:         persistence.WorkerStreamStatusRunning,
				TracingSummary: tracingSummary,
			}
			e.mu.Unlock()
			log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Starting stream")

			go func(serviceStream *serviceStream) {
				var streamStatus persistence.WorkerStreamStatus

				defer func() {
					if r := recover(); r != nil {
						log.Error().
							Err(fmt.Errorf("%v", r)).
							Int64("worker_stream_id", msg.workerStreamID).
							Msg("Stream panicked")
					}
					log.Info().Int64("worker_stream_id", msg.workerStreamID).Str("status", string(streamStatus)).Msg("Finishing stream")
					e.mu.Lock()
					e.ShipMetrics(ctx)
					delete(e.streams, msg.workerStreamID)
					e.mu.Unlock()
					if err := e.updateWorkerStreamStatus(ctx, msg.workerStreamID, streamStatus); err != nil {
						log.Warn().
							Err(err).
							Int64("worker_stream_id", msg.workerStreamID).
							Str("status", string(streamStatus)).
							Msg("Failed to update worker stream status")
					}
					log.Info().Int64("worker_stream_id", msg.workerStreamID).Str("status", string(streamStatus)).Msg("Stream has been finished")
				}()
				log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream started running")
				// Create a new context for the stream to be able to cancel it separately from the main context
				streamCtx, cancel := context.WithCancel(ctx)
				serviceStream.Cancel = cancel
				if err = stream.Run(streamCtx); err != nil {
					switch {
					case errors.Is(err, context.Canceled):
						log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream stopped: context canceled")
						streamStatus = persistence.WorkerStreamStatusStopped
					case errors.Is(err, context.DeadlineExceeded):
						log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream stopped: timeout exceeded")
						streamStatus = persistence.WorkerStreamStatusStopped
					default:
						log.Error().Err(err).Msg("Failed to run stream")
						streamStatus = persistence.WorkerStreamStatusFailed
					}
				} else {
					log.Info().Int64("worker_stream_id", msg.workerStreamID).Msg("Stream has been completed")
					streamStatus = persistence.WorkerStreamStatusCompleted
				}
			}(e.streams[msg.workerStreamID])

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
				log.Info().Int64("worker_stream_id", workerStreamID).Msg("Canceling stream")
				stream.Cancel()
			}
			// Wait for 1 second to make sure that the streams are stopped and ship metrics
			time.Sleep(1 * time.Second)
			e.streams = make(map[int64]*serviceStream)
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

func (e *workerExecutor) IngestData(ctx context.Context, workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	result := &IngestResult{}

	if stream, exists := e.streams[workerStreamID]; exists && stream != nil {
		rr := httptest.NewRecorder()
		req, err := http.NewRequest(method, path, bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", contentType)
		if err != nil {
			log.Error().
				Err(err).
				Int64("worker_stream_id", workerStreamID).
				Str("content_type", contentType).
				Str("method", method).
				Str("path", path).
				Bytes("payload", payload).
				Msg("Failed to create new request")
			return nil, err
		}
		stream.Mux.ServeHTTP(rr, req)
		result.StatusCode = rr.Code
		if rr.Body != nil {
			result.Response, err = io.ReadAll(rr.Body)
			if err != nil {
				log.Error().
					Err(err).
					Int64("worker_stream_id", workerStreamID).
					Str("content_type", contentType).
					Str("method", method).
					Str("path", path).
					Bytes("payload", payload).
					Msg("Failed to read response body")
				result.Response = []byte("Failed to read response body")
			}
		}
	} else {
		log.Debug().Int64("worker_stream_id", workerStreamID).Msg("HTTP Server of the stream not found")
		return nil, fmt.Errorf("HTTP Server of the stream not found")
	}

	return result, nil
}
