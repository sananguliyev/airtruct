package executor

import (
	"context"
	"net/http"

	"github.com/sananguliyev/airtruct/internal/executor/coordinator"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type CoordinatorExecutor interface {
	CheckWorkersAndAssignStreams(context.Context) error
	CheckWorkerStreams(context.Context) error
	ForwardRequestToWorker(context.Context, *http.Request) (int32, []byte, error)
}

type coordinatorExecutor struct {
	coordinator coordinator.CoordinatorExecutor
}

func NewCoordinatorExecutor(
	workerRepo persistence.WorkerRepository,
	streamRepo persistence.StreamRepository,
	streamCacheRepo persistence.StreamCacheRepository,
	streamRateLimitRepo persistence.StreamRateLimitRepository,
	workerStreamRepo persistence.WorkerStreamRepository,
) CoordinatorExecutor {
	return &coordinatorExecutor{
		coordinator: coordinator.NewCoordinatorExecutor(workerRepo, streamRepo, streamCacheRepo, streamRateLimitRepo, workerStreamRepo),
	}
}

func (e *coordinatorExecutor) CheckWorkersAndAssignStreams(ctx context.Context) error {
	return e.coordinator.CheckWorkersAndAssignStreams(ctx)
}

func (e *coordinatorExecutor) CheckWorkerStreams(ctx context.Context) error {
	return e.coordinator.CheckWorkerStreams(ctx)
}

func (e *coordinatorExecutor) ForwardRequestToWorker(ctx context.Context, r *http.Request) (int32, []byte, error) {
	return e.coordinator.ForwardRequestToWorker(ctx, r)
}
