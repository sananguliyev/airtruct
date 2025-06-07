package executor

import (
	"container/heap"
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"slices"
	"strconv"
	"sync"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/emptypb"
	"gopkg.in/yaml.v3"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
	"github.com/sananguliyev/airtruct/internal/utils"
)

type CoordinatorExecutor interface {
	CheckWorkersAndAssignStreams(context.Context) error
	CheckWorkerStreams(context.Context) error
	ForwardRequestToWorker(context.Context, *http.Request) (int32, []byte, error)
}

type coordinatorExecutor struct {
	mu                 sync.Mutex
	workerRepo         persistence.WorkerRepository
	streamRepo         persistence.StreamRepository
	workerStreamRepo   persistence.WorkerStreamRepository
	workerClients      map[string]pb.WorkerClient
	streamWorker       map[int64]string
	streamWorkerStream map[int64]int64
	pathRegex          *regexp.Regexp
}

func NewCoordinatorExecutor(
	workerRepo persistence.WorkerRepository,
	streamRepo persistence.StreamRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) CoordinatorExecutor {
	executor := &coordinatorExecutor{
		workerRepo:         workerRepo,
		streamRepo:         streamRepo,
		workerStreamRepo:   workerStreamRepo,
		workerClients:      make(map[string]pb.WorkerClient),
		streamWorker:       make(map[int64]string),
		streamWorkerStream: make(map[int64]int64),
		pathRegex:          regexp.MustCompile(`^/ingest/(\d+)(/.*)?$`),
	}

	workerStreams, err := workerStreamRepo.ListAllByStatuses(persistence.WorkerStreamStatusRunning)
	if err != nil {
		log.Error().Err(err).Msg("Failed to list all running worker streams, suggesting to restart the coordinator, otherwise HTTP streams will not be reachable")
	}
	for _, workerStream := range workerStreams {
		executor.streamWorker[workerStream.StreamID] = workerStream.Worker.ID
		executor.streamWorkerStream[workerStream.StreamID] = workerStream.ID
		if workerStream.Stream.ParentID != nil {
			executor.streamWorker[*workerStream.Stream.ParentID] = workerStream.Worker.ID
			executor.streamWorkerStream[*workerStream.Stream.ParentID] = workerStream.ID
		}
	}
	log.Info().Int("running_worker_stream_count", len(workerStreams)).Msg("Loaded running worker streams")

	return executor
}

func (e *coordinatorExecutor) CheckWorkersAndAssignStreams(ctx context.Context) error {
	var err error

	workerHeap := &utils.WorkerHeap{}
	heap.Init(workerHeap)

	workers, err := e.workerRepo.FindAllActiveWithRunningStreamCount()
	if err != nil {
		return err
	}

	for _, worker := range workers {
		workerGRPCClient, err := e.getWorkerClient(&worker)
		if err != nil {
			log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to create grpc connection to worker")
			e.deactivateWorker(worker.ID)
			continue
		}

		if _, err = workerGRPCClient.HealthCheck(ctx, &emptypb.Empty{}); err != nil {
			log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to perform health check")
			e.deactivateWorker(worker.ID)
			continue
		}

		heap.Push(workerHeap, worker)

		log.Debug().Str("worker_id", worker.ID).Msg("Worker is healthy")
	}

	streams, err := e.streamRepo.ListAllActiveAndNonAssigned()
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
		err = e.assignJob(ctx, worker, stream)
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

func (e *coordinatorExecutor) CheckWorkerStreams(ctx context.Context) error {
	checkStream := func(workerClient pb.WorkerClient, workerStream *persistence.WorkerStream) {
		resp, err := workerClient.FetchStream(ctx, &pb.FetchStreamRequest{WorkerStreamId: workerStream.ID})
		if err != nil {
			log.Error().
				Err(err).
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int64("worker_stream_id", workerStream.ID).
				Int64("stream_id", workerStream.StreamID).
				Msg("failed to perform stream check")

			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusStopped); err != nil {
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

		if resp.Status.String() == string(persistence.WorkerStreamStatusCompleted) {
			if err := e.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusCompleted); err != nil {
				log.Error().
					Err(err).
					Str("process", "check").
					Str("worker_id", workerStream.Worker.ID).
					Int64("worker_stream_id", workerStream.ID).
					Int64("stream_id", workerStream.StreamID).
					Msg("Failed to stop worker stream")
				return
			}

			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusCompleted); err != nil {
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
		} else if resp.Status.String() == string(persistence.WorkerStreamStatusFailed) {
			if err := e.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusFailed); err != nil {
				log.Error().
					Err(err).
					Str("process", "check").
					Str("worker_id", workerStream.Worker.ID).
					Int64("worker_stream_id", workerStream.ID).
					Int64("stream_id", workerStream.StreamID).
					Msg("Failed to stop worker stream")
				return
			}
			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusFailed); err != nil {
				log.Error().
					Err(err).
					Str("process", "check").
					Str("worker_id", workerStream.Worker.ID).
					Int64("worker_stream_id", workerStream.ID).
					Int64("stream_id", workerStream.StreamID).
					Msg("Failed to stop worker stream")
				return
			}
		} else {
			log.Debug().
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int64("worker_stream_id", workerStream.ID).
				Int64("stream_id", workerStream.StreamID).
				Msg("Worker stream is still running")
		}
	}

	completeStream := func(workerClient pb.WorkerClient, workerStream *persistence.WorkerStream) {

		resp, err := workerClient.CompleteStream(ctx, &pb.CompleteStreamRequest{WorkerStreamId: workerStream.ID})
		if err != nil {
			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusCompleted); err != nil {
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

	workerStreams, err := e.workerStreamRepo.ListAllByStatuses(persistence.WorkerStreamStatusRunning, persistence.WorkerStreamStatusWaiting)
	if err != nil {
		return err
	}

	log.Debug().Int("running_worker_stream_count", len(workerStreams)).Msg("Checking worker streams")

	for _, workerStream := range workerStreams {
		workerGRPCClient, err := e.getWorkerClient(&workerStream.Worker)
		if err != nil {
			log.Error().Err(err).Int64("worker_stream_id", workerStream.ID).Msg("Failed to get worker grpc client")
			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusStopped); err != nil {
				log.Error().
					Err(err).
					Str("worker_id", workerStream.Worker.ID).
					Int64("worker_stream_id", workerStream.ID).
					Int64("stream_id", workerStream.StreamID).
					Msg("Failed to make GRPC connection to worker")
			}
		}

		if workerStream.Stream.IsCurrent {
			checkStream(workerGRPCClient, &workerStream)
		} else {
			completeStream(workerGRPCClient, &workerStream)
		}

	}

	return nil
}

func (e *coordinatorExecutor) assignJob(ctx context.Context, worker persistence.Worker, stream persistence.Stream) error {
	workerClient, err := e.getWorkerClient(&worker)
	if err != nil {
		log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to get worker grpc client")
		return err
	}

	// We should lock mutex here otherwise it blocks getting worker client
	// and it causes deadlock
	e.mu.Lock()
	defer e.mu.Unlock()

	configMap := make(map[string]any)

	input := make(map[string]any)
	input[stream.InputComponent] = make(map[string]any)
	if err := yaml.Unmarshal(stream.InputConfig, input[stream.InputComponent]); err != nil {
		return err
	}
	input["label"] = stream.InputLabel

	output := make(map[string]any)
	output[stream.OutputComponent] = make(map[string]any)
	if err := yaml.Unmarshal(stream.OutputConfig, output[stream.OutputComponent]); err != nil {
		return err
	}
	output["label"] = stream.OutputLabel

	pipeline := map[string][]any{
		"processors": make([]any, len(stream.Processors)),
	}

	for i, processor := range stream.Processors {
		processorConfig := make(map[string]any)
		if processor.Component == "mapping" {
			processorConfig[processor.Component] = string(processor.Config)
		} else if slices.Contains([]string{"catch", "switch"}, processor.Component) {
			var catchProcessors []any
			if err := yaml.Unmarshal(processor.Config, &catchProcessors); err != nil {
				return err
			}
			processorConfig[processor.Component] = catchProcessors
		} else {
			processorConfig[processor.Component] = make(map[string]any)
			if err := yaml.Unmarshal(processor.Config, processorConfig[processor.Component]); err != nil {
				return err
			}
		}
		processorConfig["label"] = processor.Label

		pipeline["processors"][i] = processorConfig
	}

	configMap["input"] = input

	if len(stream.Processors) > 0 {
		configMap["pipeline"] = pipeline
	}

	configMap["output"] = output

	configYAML, err := yaml.Marshal(configMap)
	if err != nil {
		return err
	}

	log.Debug().
		Str("worker_id", worker.ID).
		Int64("stream_id", stream.ID).
		Str("config", string(configYAML)).
		Msg("Config for worker stream")

	workerStream, err := e.workerStreamRepo.Queue(worker.ID, stream.ID)
	if err != nil {
		return err
	}

	resp, err := workerClient.AssignStream(ctx, &pb.AssignStreamRequest{WorkerStreamId: workerStream.ID, Config: string(configYAML)})
	if err != nil {
		if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusFailed); err != nil {
			log.Warn().Err(err).Int64("worker_stream_id", workerStream.ID).Msg("Failed to update worker stream status after failed assignment")
		}
		return err
	}
	e.streamWorker[stream.ID] = worker.ID
	e.streamWorkerStream[stream.ID] = workerStream.ID
	if stream.ParentID != nil {
		e.streamWorker[*stream.ParentID] = worker.ID
		e.streamWorkerStream[*stream.ParentID] = workerStream.ID
	}

	log.Info().
		Str("worker_id", worker.ID).
		Int64("stream_id", stream.ID).
		Int64("worker_stream_id", workerStream.ID).
		Str("worker_stream_assign_response", resp.Message).
		Msg("Assigned job to worker")

	return nil
}

func (e *coordinatorExecutor) deactivateWorker(workerID string) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if err := e.workerRepo.Deactivate(workerID); err != nil {
		log.Error().Err(err).Str("worker_id", workerID).Msg("Failed to deactivate worker")
		return
	}

	if err := e.workerStreamRepo.StopAllRunningAndWaitingByWorkerID(workerID); err != nil {
		log.Warn().Err(err).Str("worker_id", workerID).Msg("Failed to update all worker streams statuses in worker")
		return
	}
	delete(e.workerClients, workerID)

	log.Info().Str("worker_id", workerID).Msg("Worker is unhealthy and deactivated")
}

func (e *coordinatorExecutor) getWorkerClient(worker *persistence.Worker) (pb.WorkerClient, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	var workerGRPCClient pb.WorkerClient
	workerGRPCClient, clientExists := e.workerClients[worker.ID]
	if !clientExists {
		log.Debug().Str("worker_id", worker.ID).Msg("Creating new grpc client for worker")
		grpcConn, err := grpc.NewClient(worker.Address, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			return nil, err
		}

		workerGRPCClient = pb.NewWorkerClient(grpcConn)
		e.workerClients[worker.ID] = workerGRPCClient
	}

	return workerGRPCClient, nil
}

// ForwardRequestToWorker forwards the HTTP request to the worker based on the stream ID in the URL path.
// It returns the status code and response body from the worker.
func (e *coordinatorExecutor) ForwardRequestToWorker(ctx context.Context, r *http.Request) (int32, []byte, error) {
	var err error
	var id int64
	var componentPath string

	matches := e.pathRegex.FindStringSubmatch(r.URL.Path)
	if matches == nil {
		return 0, nil, fmt.Errorf("invalid path format")
	}

	id, err = strconv.ParseInt(matches[1], 10, 64)
	if err != nil {
		return 0, nil, fmt.Errorf("invalid ID format")
	}

	if len(matches) > 2 && matches[2] != "" {
		componentPath = matches[2]
	}

	workerStreamID, ok := e.streamWorkerStream[id]
	if !ok {
		return 0, nil, fmt.Errorf("worker stream not found for stream ID %d", id)
	}

	workerID, ok := e.streamWorker[id]
	if !ok {
		return 0, nil, fmt.Errorf("worker not found for stream ID %d", id)
	}
	workerClient, err := e.getWorkerClient(&persistence.Worker{ID: workerID})
	if err != nil {
		return 0, nil, fmt.Errorf("failed to get worker client: %w", err)
	}
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to read request body: %w", err)
	}
	defer r.Body.Close()

	resp, err := workerClient.Ingest(ctx, &pb.IngestRequest{
		WorkerStreamId: workerStreamID,
		Method:         r.Method,
		Path:           componentPath,
		ContentType:    r.Header.Get("Content-Type"),
		Payload:        bodyBytes,
	})

	if err != nil {
		return 0, nil, fmt.Errorf("failed to forward request to worker: %w", err)
	}

	return resp.StatusCode, resp.Response, nil
}
