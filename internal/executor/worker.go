package executor

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

const (
	WorkerRegisterEndpoint           = "/workers"
	WorkerStreamUpdateStatusEndpoint = "/worker/stream"
	StreamerEndpoint                 = "http://localhost:4195/streams"
)

type WorkerExecutor interface {
	JoinToCoordinator() error
	StartStream(workerStreamID int, config string) error
	ShipLogs() error
}

type workerExecutor struct {
	httpClient *http.Client
	nodeConfig *config.NodeConfig
	joined     bool
}

func NewWorkerExecutor(nodeConfig *config.NodeConfig) WorkerExecutor {
	return &workerExecutor{httpClient: &http.Client{}, nodeConfig: nodeConfig}
}

func (e *workerExecutor) JoinToCoordinator() error {
	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	if e.joined {
		log.Debug().Str("worker_id", hostname).Msg("Worker already joined to coordinator")
		return nil
	}

	requestBody, err := json.Marshal(map[string]any{"id": hostname, "port": e.nodeConfig.Port})
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s%s", e.nodeConfig.DiscoveryUri, WorkerRegisterEndpoint), bytes.NewBuffer(requestBody))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("failed to register on coordinator")
	}

	e.joined = true
	log.Info().Str("worker_id", hostname).Msg("Joined to coordinator")

	return nil
}

func (e *workerExecutor) StartStream(workerStreamID int, config string) error {
	var targetStatus persistence.WorkerStreamStatus

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/worker_stream_%d", StreamerEndpoint, workerStreamID), bytes.NewBufferString(config))

	defer func() {
		if err := e.updateWorkerStreamStatus(workerStreamID, targetStatus); err != nil {
			log.Warn().Err(err).Int("worker_stream_id", workerStreamID).Msg("Failed to update worker stream status")
		}
	}()

	if err != nil {
		targetStatus = persistence.WorkerStreamStatusFailed
		return err
	}

	req.Header.Set("Content-Type", "application/yaml")

	resp, err := e.httpClient.Do(req)
	if err != nil {
		targetStatus = persistence.WorkerStreamStatusFailed
		return err
	}

	if resp.StatusCode != http.StatusOK {
		targetStatus = persistence.WorkerStreamStatusFailed
		return errors.New("failed to register on coordinator")
	}

	_ = resp.Body.Close()

	targetStatus = persistence.WorkerStreamStatusRunning

	log.Info().Int("worker_stream_id", workerStreamID).Msg("Stream started for processing")

	return nil
}

func (e *workerExecutor) ShipLogs() error {
	// Implement log shipment logic here
	return nil
}

func (e *workerExecutor) updateWorkerStreamStatus(workerStreamID int, status persistence.WorkerStreamStatus) error {
	requestBody, err := json.Marshal(map[string]any{"worker_stream_id": workerStreamID, "status": status})
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PUT", fmt.Sprintf("%s%s", e.nodeConfig.DiscoveryUri, WorkerStreamUpdateStatusEndpoint), bytes.NewBuffer(requestBody))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("failed to update worker stream status")
	}

	return nil
}
