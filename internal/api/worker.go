package api

import (
	"context"

	"github.com/rs/zerolog/log"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/sananguliyev/airtruct/internal/executor"
)

type WorkerAPI struct {
	pb.UnimplementedWorkerServer
	workerExecutor executor.WorkerExecutor
}

func NewWorkerAPI(workerExecutor executor.WorkerExecutor) *WorkerAPI {
	return &WorkerAPI{
		workerExecutor: workerExecutor,
	}
}

func (a *WorkerAPI) AssignStream(ctx context.Context, in *pb.AssignStreamRequest) (*pb.CommonResponse, error) {
	log.Debug().
		Int64("worker_stream_id", in.GetWorkerStreamId()).
		Str("config", in.GetConfig()).
		Msg("Starting stream for processing")

	err := a.workerExecutor.AddStreamToQueue(ctx, in.GetWorkerStreamId(), in.GetConfig(), in.GetFiles())
	if err != nil {
		log.Error().Err(err).Int64("worker_stream_id", in.GetWorkerStreamId()).Msg("Failed to queue stream")
		return nil, status.Error(codes.Internal, "Failed to queue stream")
	}

	return &pb.CommonResponse{Message: "Stream queued for processing"}, nil
}

func (a *WorkerAPI) FetchStream(ctx context.Context, in *pb.FetchStreamRequest) (*pb.FetchStreamResponse, error) {
	log.Debug().
		Int64("worker_stream_id", in.GetWorkerStreamId()).
		Msg("Fetching stream for processing")

	streamStatus, err := a.workerExecutor.FetchWorkerStreamStatus(ctx, in.GetWorkerStreamId())
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch stream")
		return nil, status.Error(codes.Internal, "Failed to fetch stream")
	} else if streamStatus == nil {
		return nil, status.Error(codes.NotFound, "Stream not found in worker")
	}
	return &pb.FetchStreamResponse{
		Status: pb.WorkerStreamStatus(pb.WorkerStreamStatus_value[string(*streamStatus)]),
	}, nil
}

func (a *WorkerAPI) CompleteStream(ctx context.Context, in *pb.CompleteStreamRequest) (*pb.CommonResponse, error) {
	var err error

	log.Debug().
		Int64("worker_stream_id", in.GetWorkerStreamId()).
		Msg("Starting stream for processing")

	if err = a.workerExecutor.DeleteWorkerStream(ctx, in.GetWorkerStreamId()); err != nil {
		log.Error().Err(err).Int64("worker_stream_id", in.GetWorkerStreamId()).Msg("Failed to delete worker stream")
		return nil, status.Error(codes.Internal, "Failed to delete stream in worker")
	}

	return &pb.CommonResponse{Message: "Worker Stream has been deleted successfully"}, nil
}

func (a *WorkerAPI) HealthCheck(_ context.Context, _ *emptypb.Empty) (*pb.CommonResponse, error) {
	return &pb.CommonResponse{
		Message: "OK",
	}, nil
}

func (a *WorkerAPI) Ingest(ctx context.Context, in *pb.IngestRequest) (*pb.IngestResponse, error) {

	log.Debug().
		Int64("worker_stream_id", in.GetWorkerStreamId()).
		Bytes("data", in.GetPayload()).
		Msg("Ingesting data")
	ingestResult, err := a.workerExecutor.IngestData(
		ctx,
		in.GetWorkerStreamId(),
		in.GetMethod(),
		in.GetPath(),
		in.GetContentType(),
		in.GetPayload(),
	)
	if err != nil {
		log.Error().
			Err(err).
			Int64("worker_stream_id", in.GetWorkerStreamId()).
			Msg("Failed to ingest data")
		return nil, status.Errorf(codes.Internal, "Failed to ingest data: %v", err)
	}

	return &pb.IngestResponse{
		StatusCode: int32(ingestResult.StatusCode),
		Response:   ingestResult.Response,
	}, nil
}
