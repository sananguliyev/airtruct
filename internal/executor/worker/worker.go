package worker

import (
	"context"

	"google.golang.org/grpc"

	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/vault"
)

type WorkerExecutor interface {
	JoinToCoordinator(context.Context) error
	LeaveCoordinator(context.Context) error
	SendHeartbeat(context.Context) error
	AddStreamToQueue(ctx context.Context, workerStreamID int64, config string) error
	FetchWorkerStreamStatus(ctx context.Context, workerStreamID int64) (*persistence.WorkerStreamStatus, error)
	DeleteWorkerStream(ctx context.Context, workerStreamID int64) error
	ShipLogs(context.Context)
	ShipMetrics(context.Context)
	ConsumeStreamQueue(context.Context)
	IngestData(ctx context.Context, workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error)
}

type workerExecutor struct {
	coordinatorConnection CoordinatorConnection
	streamManager         StreamManager
	streamQueue           StreamQueue
	telemetryManager      TelemetryManager
}

func NewWorkerExecutor(grpcConn *grpc.ClientConn, grpcPort uint32, vaultProvider vault.VaultProvider) WorkerExecutor {
	coordinatorConnection := NewCoordinatorConnection(grpcConn, grpcPort)

	streamManager := NewStreamManager(coordinatorConnection, vaultProvider)

	streamQueue := NewStreamQueue(streamManager)

	telemetryManager := NewTelemetryManager(coordinatorConnection, streamManager)

	return &workerExecutor{
		coordinatorConnection: coordinatorConnection,
		streamManager:         streamManager,
		streamQueue:           streamQueue,
		telemetryManager:      telemetryManager,
	}
}

func (e *workerExecutor) JoinToCoordinator(ctx context.Context) error {
	return e.coordinatorConnection.JoinToCoordinator(ctx)
}

func (e *workerExecutor) LeaveCoordinator(ctx context.Context) error {
	return e.coordinatorConnection.LeaveCoordinator(ctx)
}

func (e *workerExecutor) SendHeartbeat(ctx context.Context) error {
	return e.coordinatorConnection.SendHeartbeat(ctx)
}

func (e *workerExecutor) AddStreamToQueue(ctx context.Context, workerStreamID int64, config string) error {
	return e.streamQueue.AddStreamToQueue(workerStreamID, config)
}

func (e *workerExecutor) FetchWorkerStreamStatus(ctx context.Context, workerStreamID int64) (*persistence.WorkerStreamStatus, error) {
	return e.streamManager.GetStreamStatus(workerStreamID)
}

func (e *workerExecutor) DeleteWorkerStream(ctx context.Context, workerStreamID int64) error {
	return e.streamManager.DeleteStream(workerStreamID)
}

func (e *workerExecutor) ShipLogs(ctx context.Context) {
	e.telemetryManager.ShipLogs(ctx)
}

func (e *workerExecutor) ShipMetrics(ctx context.Context) {
	e.telemetryManager.ShipMetrics(ctx)
}

func (e *workerExecutor) ConsumeStreamQueue(ctx context.Context) {
	e.streamQueue.ConsumeStreamQueue(ctx)
}

func (e *workerExecutor) IngestData(ctx context.Context, workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error) {
	return e.streamManager.IngestData(workerStreamID, method, path, contentType, payload)
}
