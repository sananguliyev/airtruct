package worker

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"maps"
	"net/http"
	"net/http/httptest"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/warpstreamlabs/bento/public/service"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type IngestResult struct {
	StatusCode int
	Response   []byte
}

type ServiceStream struct {
	Stream         *service.Stream
	Cancel         context.CancelFunc
	Mux            *http.ServeMux
	Status         persistence.WorkerStreamStatus
	TracingSummary *service.TracingSummary
}

type StreamManager interface {
	AddStream(workerStreamID int64, config string) error
	GetStream(workerStreamID int64) (*ServiceStream, bool)
	GetStreamStatus(workerStreamID int64) (*persistence.WorkerStreamStatus, error)
	DeleteStream(workerStreamID int64) error
	IngestData(workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error)
	GetAllStreams() map[int64]*ServiceStream
	StopAllStreams()
	StartStream(ctx context.Context, workerStreamID int64)
}

type streamManager struct {
	mu                    sync.RWMutex
	streams               map[int64]*ServiceStream
	coordinatorConnection CoordinatorConnection
	vaultProvider         vault.VaultProvider
}

func NewStreamManager(coordinatorConnection CoordinatorConnection, vaultProvider vault.VaultProvider) StreamManager {
	return &streamManager{
		streams:               make(map[int64]*ServiceStream),
		coordinatorConnection: coordinatorConnection,
		vaultProvider:         vaultProvider,
	}
}

func (m *streamManager) AddStream(workerStreamID int64, config string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.streams[workerStreamID]; exists {
		log.Debug().Int64("worker_stream_id", workerStreamID).Msg("Stream already exists")
		return nil
	}

	streamBuilder := service.NewStreamBuilder()
	streamMux := http.NewServeMux()
	streamBuilder.SetHTTPMux(streamMux)

	streamBuilder.SetEnvVarLookupFunc(func(key string) (string, bool) {
		secret, err := m.vaultProvider.GetSecret(key)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get secret")
			return "", false
		}

		return secret, true
	})

	if err := streamBuilder.SetYAML(config); err != nil {
		log.Error().Err(err).Msg("Failed to set stream YAML")
		return err
	}

	stream, tracingSummary, err := streamBuilder.BuildTraced()
	if err != nil {
		log.Error().Err(err).Msg("Failed to build stream")
		return err
	}

	serviceStream := &ServiceStream{
		Stream:         stream,
		Mux:            streamMux,
		Status:         persistence.WorkerStreamStatusRunning,
		TracingSummary: tracingSummary,
	}

	m.streams[workerStreamID] = serviceStream
	log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream added to manager")

	return nil
}

func (m *streamManager) GetStream(workerStreamID int64) (*ServiceStream, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stream, exists := m.streams[workerStreamID]
	return stream, exists
}

func (m *streamManager) GetStreamStatus(workerStreamID int64) (*persistence.WorkerStreamStatus, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stream, exists := m.streams[workerStreamID]
	if !exists {
		return nil, nil
	}

	return &stream.Status, nil
}

func (m *streamManager) DeleteStream(workerStreamID int64) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	stream, exists := m.streams[workerStreamID]
	if !exists {
		return fmt.Errorf("stream with ID %d not found", workerStreamID)
	}

	if stream.Stream != nil {
		if err := stream.Stream.StopWithin(5 * time.Second); err != nil {
			log.Warn().Err(err).Int64("worker_stream_id", workerStreamID).Msg("Failed to stop stream gracefully, forcing shutdown")
		}
	}

	if stream.Cancel != nil {
		stream.Cancel()
	}

	delete(m.streams, workerStreamID)
	log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream deleted from manager")

	return nil
}

func (m *streamManager) IngestData(workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := &IngestResult{}

	stream, exists := m.streams[workerStreamID]
	if !exists {
		log.Debug().Int64("worker_stream_id", workerStreamID).Msg("HTTP Server of the stream not found")
		return nil, fmt.Errorf("HTTP Server of the stream not found")
	}

	rr := httptest.NewRecorder()
	req, err := http.NewRequest(method, path, bytes.NewBuffer(payload))
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

	req.Header.Set("Content-Type", contentType)

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

	return result, nil
}

func (m *streamManager) GetAllStreams() map[int64]*ServiceStream {
	m.mu.RLock()
	defer m.mu.RUnlock()

	streams := make(map[int64]*ServiceStream)
	maps.Copy(streams, m.streams)

	return streams
}

func (m *streamManager) StopAllStreams() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for workerStreamID, stream := range m.streams {
		log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stopping stream")
		if stream.Cancel != nil {
			stream.Cancel()
		}
	}

	m.streams = make(map[int64]*ServiceStream)
	log.Info().Msg("All streams stopped")
}

func (m *streamManager) StartStream(ctx context.Context, workerStreamID int64) {
	stream, exists := m.GetStream(workerStreamID)
	if !exists {
		log.Error().Int64("worker_stream_id", workerStreamID).Msg("Stream not found for starting")
		return
	}

	log.Info().Int64("worker_stream_id", workerStreamID).Msg("Starting stream")

	if err := m.coordinatorConnection.UpdateWorkerStreamStatus(ctx, workerStreamID, pb.WorkerStreamStatus(pb.WorkerStreamStatus_value[string(persistence.WorkerStreamStatusRunning)])); err != nil {
		log.Warn().
			Err(err).
			Int64("worker_stream_id", workerStreamID).
			Str("status", string(persistence.WorkerStreamStatusRunning)).
			Msg("Failed to update worker stream status")
	}

	go func() {
		var streamStatus persistence.WorkerStreamStatus

		defer func() {
			if r := recover(); r != nil {
				log.Error().
					Err(fmt.Errorf("%v", r)).
					Int64("worker_stream_id", workerStreamID).
					Msg("Stream panicked")
			}

			log.Info().Int64("worker_stream_id", workerStreamID).Str("status", string(streamStatus)).Msg("Finishing stream")

			m.shipMetrics(ctx, workerStreamID, stream.TracingSummary)

			if err := m.DeleteStream(workerStreamID); err != nil {
				log.Debug().Err(err).Int64("worker_stream_id", workerStreamID).Msg("Stream already deleted")
			}

			if err := m.coordinatorConnection.UpdateWorkerStreamStatus(ctx, workerStreamID, pb.WorkerStreamStatus(pb.WorkerStreamStatus_value[string(streamStatus)])); err != nil {
				log.Warn().
					Err(err).
					Int64("worker_stream_id", workerStreamID).
					Str("status", string(streamStatus)).
					Msg("Failed to update worker stream status")
			}

			log.Info().Int64("worker_stream_id", workerStreamID).Str("status", string(streamStatus)).Msg("Stream has been finished")
		}()

		streamCtx, cancel := context.WithCancel(ctx)
		stream.Cancel = cancel

		m.mu.Lock()
		stream.Status = persistence.WorkerStreamStatusRunning
		m.mu.Unlock()

		log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream started running")

		if err := stream.Stream.Run(streamCtx); err != nil {
			switch {
			case errors.Is(err, context.Canceled):
				log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream stopped: context canceled")
				streamStatus = persistence.WorkerStreamStatusStopped
			case errors.Is(err, context.DeadlineExceeded):
				log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream stopped: timeout exceeded")
				streamStatus = persistence.WorkerStreamStatusStopped
			default:
				log.Error().Err(err).Msg("Failed to run stream")
				streamStatus = persistence.WorkerStreamStatusFailed
			}
		} else {
			log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream has been completed")
			streamStatus = persistence.WorkerStreamStatusCompleted
		}
	}()
}

func (m *streamManager) shipMetrics(ctx context.Context, workerStreamID int64, tracingSummary *service.TracingSummary) {
	if tracingSummary == nil {
		return
	}

	err := m.coordinatorConnection.IngestMetrics(
		ctx,
		workerStreamID,
		tracingSummary.TotalInput(),
		tracingSummary.TotalProcessorErrors(),
		tracingSummary.TotalOutput(),
	)
	if err != nil {
		log.Error().Err(err).Int64("worker_stream_id", workerStreamID).Msg("Failed to ship metrics")
	}
}
