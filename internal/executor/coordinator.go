package executor

import (
	"bytes"
	"container/heap"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"

	"gopkg.in/yaml.v3"

	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/utils"
)

const (
	WorkerHealthAssignStream           = "/assign-stream"
	WorkerHealthCheckEndpoint          = "/healthz"
	WorkerStreamCheckAndDeleteEndpoint = "/streams/%s" // %s is stream id

	StreamApiPortInWorker = 4195
)

type CoordinatorExecutor interface {
	CheckWorkersAndAssignStreams() error
	CheckWorkerStreams() error
}

type coordinatorExecutor struct {
	workerRepo       persistence.WorkerRepository
	streamRepo       persistence.StreamRepository
	workerStreamRepo persistence.WorkerStreamRepository
	httpClient       *http.Client
}

func NewCoordinatorExecutor(
	workerRepo persistence.WorkerRepository,
	streamRepo persistence.StreamRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) CoordinatorExecutor {
	return &coordinatorExecutor{workerRepo, streamRepo, workerStreamRepo, &http.Client{}}
}

func (e *coordinatorExecutor) CheckWorkersAndAssignStreams() error {
	var err error

	workerHeap := &utils.WorkerHeap{}
	heap.Init(workerHeap)

	workers, err := e.workerRepo.FindAllActiveWithRunningStreamCount()
	if err != nil {
		return err
	}

	for _, worker := range workers {
		resp, err := e.httpClient.Get(fmt.Sprintf("http://%s%s", worker.Address, WorkerHealthCheckEndpoint))
		if err != nil {
			log.Error().Err(err).Str("worker_id", worker.ID).Msg("Failed to perform health check")

			e.deactivateWorker(worker.ID)
			continue
		}

		_ = resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
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
		log.Warn().Msg("No active workers to assign streams")
		return nil
	}

	for _, stream := range streams {
		worker := heap.Pop(workerHeap).(persistence.Worker)
		err = e.assignJob(worker, stream)
		if err != nil {
			log.Error().
				Err(err).
				Str("worker_id", worker.ID).
				Int("stream_id", stream.ID).
				Msg("Failed to assign job")
		} else {
			log.Debug().
				Str("worker_id", worker.ID).
				Int("stream_id", stream.ID).
				Msg("Assigned job to worker")
			worker.RunningStreamCount++
		}
		workerHeap.Push(worker)
	}

	return nil
}

func (e *coordinatorExecutor) CheckWorkerStreams() error {

	checkStream := func(address, endpoint string, workerStream *persistence.WorkerStream) {
		resp, err := e.httpClient.Get(fmt.Sprintf("http://%s%s", address, endpoint))
		if err != nil {
			log.Error().
				Err(err).
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Msg("failed to perform health check")
			return
		}

		if resp.StatusCode == http.StatusNotFound {
			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusStopped); err != nil {
				log.Error().
					Err(err).
					Str("process", "check").
					Str("worker_id", workerStream.Worker.ID).
					Int("worker_stream_id", workerStream.ID).
					Int("stream_id", workerStream.StreamID).
					Msg("Failed to update worker stream status")
			}
			return
		} else if resp.StatusCode != http.StatusOK {
			log.Error().
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Int("worker_stream_check_status_code", resp.StatusCode).
				Msg("Worker stream check failed")
			return
		}

		streamStatus := make(map[string]any)
		if err := json.NewDecoder(resp.Body).Decode(&streamStatus); err != nil {
			log.Error().
				Err(err).
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Msg("Failed to decode stream status")
			return
		}

		if streamStatus["active"] == false {
			if err := e.streamRepo.UpdateStatus(workerStream.StreamID, persistence.StreamStatusFinished); err != nil {
				log.Error().
					Err(err).
					Str("process", "check").
					Str("worker_id", workerStream.Worker.ID).
					Int("worker_stream_id", workerStream.ID).
					Int("stream_id", workerStream.StreamID).
					Msg("Failed to stop worker stream")
				return
			}

			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusFinished); err != nil {
				log.Error().
					Str("process", "check").
					Err(err).Int("worker_stream_id", workerStream.ID).
					Msg("Failed to stop worker stream")
				return
			}

			log.Info().
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Msg("Worker stream has been finished job")
		} else {
			log.Debug().
				Str("process", "check").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Msg("Worker stream is still running")
		}
	}

	deleteStream := func(address, endpoint string, workerStream *persistence.WorkerStream) {
		req, err := http.NewRequest("DELETE", fmt.Sprintf("http://%s%s", address, endpoint), nil)
		if err != nil {
			log.Error().
				Err(err).
				Str("process", "delete").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Msg("failed to create request")
			return
		}

		resp, err := e.httpClient.Do(req)
		if err != nil {
			log.Error().
				Err(err).
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("stream_id", workerStream.StreamID).
				Msg("delete request has been failed")
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusNotFound {
			if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusStopped); err != nil {
				log.Error().
					Err(err).
					Str("process", "delete").
					Str("worker_id", workerStream.Worker.ID).
					Int("worker_stream_id", workerStream.ID).
					Int("stream_id", workerStream.StreamID).
					Msg("Failed to update worker stream status")
			}
			return
		} else if resp.StatusCode != http.StatusOK {
			log.Error().
				Str("process", "delete").
				Str("worker_id", workerStream.Worker.ID).
				Int("worker_stream_id", workerStream.ID).
				Int("worker_stream_check_status_code", resp.StatusCode).
				Msg("Worker stream check failed")
			return
		}

	}

	workerStreams, err := e.workerStreamRepo.ListAllByStatuses(persistence.WorkerStreamStatusRunning, persistence.WorkerStreamStatusWaiting)
	if err != nil {
		return err
	}

	log.Debug().Int("running_worker_stream_count", len(workerStreams)).Msg("Checking worker streams")

	for _, workerStream := range workerStreams {
		host, _, err := net.SplitHostPort(workerStream.Worker.Address)
		if err != nil {
			log.Error().Err(err).Str("worker_id", workerStream.Worker.ID).Msg("Failed to split worker address to host and port")
			continue
		}

		address := net.JoinHostPort(host, fmt.Sprintf("%d", StreamApiPortInWorker))
		endpoint := fmt.Sprintf(WorkerStreamCheckAndDeleteEndpoint, fmt.Sprintf("worker_stream_%d", workerStream.ID))

		if workerStream.Stream.IsCurrent {
			checkStream(address, endpoint, &workerStream)
		} else {
			deleteStream(address, endpoint, &workerStream)
		}

	}

	return nil
}

func (e *coordinatorExecutor) assignJob(worker persistence.Worker, stream persistence.Stream) error {
	configMap := make(map[string]any)

	input := make(map[string]any)
	if err := json.Unmarshal(stream.Input.Config, &input); err != nil {
		return err
	}
	// input[stream.Input.Component] = input

	output := make(map[string]any)
	if err := json.Unmarshal(stream.Output.Config, &output); err != nil {
		return err
	}

	pipeline := map[string][]any{
		"processors": make([]any, len(stream.Processors)),
	}

	for i, processor := range stream.Processors {
		processorConfig := make(map[string]any)
		if err := json.Unmarshal(processor.Processor.Config, &processorConfig); err != nil {
			return err
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

	fmt.Println(string(configYAML))

	workerStream, err := e.workerStreamRepo.Queue(worker.ID, stream.ID)
	if err != nil {
		return err
	}

	body, err := json.Marshal(struct {
		WorkerStreamID int    `json:"worker_stream_id"`
		Config         string `json:"config"`
	}{
		WorkerStreamID: workerStream.ID,
		Config:         string(configYAML),
	})
	if err != nil {
		return err
	}

	resp, err := e.httpClient.
		Post(
			fmt.Sprintf("http://%s%s", worker.Address, WorkerHealthAssignStream),
			"application/json",
			bytes.NewReader(body),
		)
	if err != nil {
		if err := e.workerStreamRepo.UpdateStatus(workerStream.ID, persistence.WorkerStreamStatusFailed); err != nil {
			log.Warn().Err(err).Int("worker_stream_id", workerStream.ID).Msg("Failed to update worker stream status after failed assignment")
		}
		return err
	}

	_ = resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("failed to assign job on worker")
	}

	log.Info().
		Str("worker_id", worker.ID).
		Int("stream_id", stream.ID).
		Int("worker_stream_id", workerStream.ID).
		Msg("Assigned job to worker")

	return nil
}

func (e *coordinatorExecutor) deactivateWorker(workerID string) {
	if err := e.workerRepo.Deactivate(workerID); err != nil {
		log.Error().Err(err).Str("worker_id", workerID).Msg("Failed to deactivate worker")
		return
	}

	if err := e.workerStreamRepo.StopAllByWorkerID(workerID); err != nil {
		log.Warn().Err(err).Str("worker_id", workerID).Msg("Failed to update all worker streams statuses in worker")
		return
	}

	log.Info().Str("worker_id", workerID).Msg("Worker is unhealthy and deactivated")
}
