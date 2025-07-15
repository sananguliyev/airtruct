package executor

import (
	"context"

	"github.com/sananguliyev/airtruct/internal/executor/worker"
	"github.com/sananguliyev/airtruct/internal/persistence"
	"github.com/sananguliyev/airtruct/internal/vault"

	"google.golang.org/grpc"
)

type IngestResult = worker.IngestResult

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

type workerExecutor struct {
	worker worker.WorkerExecutor
}

func NewWorkerExecutor(grpcConn *grpc.ClientConn, grpcPort uint32, vaultProvider vault.VaultProvider) WorkerExecutor {
	return &workerExecutor{
		worker: worker.NewWorkerExecutor(grpcConn, grpcPort, vaultProvider),
	}
}

func (e *workerExecutor) JoinToCoordinator(ctx context.Context) error {
	return e.worker.JoinToCoordinator(ctx)
}

func (e *workerExecutor) LeaveCoordinator(ctx context.Context) error {
	return e.worker.LeaveCoordinator(ctx)
}

func (e *workerExecutor) AddStreamToQueue(ctx context.Context, workerStreamID int64, config string) error {
	return e.worker.AddStreamToQueue(ctx, workerStreamID, config)
}

func (e *workerExecutor) FetchWorkerStreamStatus(ctx context.Context, workerStreamID int64) (*persistence.WorkerStreamStatus, error) {
	return e.worker.FetchWorkerStreamStatus(ctx, workerStreamID)
}

func (e *workerExecutor) DeleteWorkerStream(ctx context.Context, workerStreamID int64) error {
	return e.worker.DeleteWorkerStream(ctx, workerStreamID)
}

func (e *workerExecutor) ShipLogs(ctx context.Context) {
	e.worker.ShipLogs(ctx)
}

func (e *workerExecutor) ShipMetrics(ctx context.Context) {
	e.worker.ShipMetrics(ctx)
}

func (e *workerExecutor) ConsumeStreamQueue(ctx context.Context) {
	e.worker.ConsumeStreamQueue(ctx)
}

func (e *workerExecutor) IngestData(ctx context.Context, workerStreamID int64, method, path, contentType string, payload []byte) (*IngestResult, error) {
	return e.worker.IngestData(ctx, workerStreamID, method, path, contentType, payload)
}
