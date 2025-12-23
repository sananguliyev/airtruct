package coordinator

import (
	"context"
	"fmt"
	"net"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (c *CoordinatorAPI) RegisterWorker(ctx context.Context, in *pb.RegisterWorkerRequest) (*pb.CommonResponse, error) {
	var workerEntity *persistence.Worker
	var err error

	p, ok := peer.FromContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "no peer found")
	}

	clientAddr := p.Addr.String()
	log.Debug().Str("client_addr", clientAddr).Msg("Client joining to coordinator")
	tcpAddr, err := net.ResolveTCPAddr("tcp", clientAddr)
	if err != nil {
		log.Error().Err(err).Str("client_addr", clientAddr).Msg("failed to resolve tcp address")
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Extract just the IP address (without ephemeral port)
	clientAddr = tcpAddr.IP.String()
	if ip := net.ParseIP(clientAddr); ip != nil {
		if ip.IsLoopback() {
			clientAddr = "127.0.0.1"
		}
	}

	workerEntity, err = c.workerRepo.FindByID(in.GetId())
	if err != nil {
		log.Error().Err(err).Str("worker_id", in.GetId()).Msg("Failed to find worker")
		return nil, status.Error(codes.Internal, "failed to find worker")
	}

	if workerEntity != nil && workerEntity.Status == persistence.WorkerStatusActive {
		return &pb.CommonResponse{
			Message: "Worker has already been registered",
		}, nil
	}

	if workerEntity != nil {
		workerEntity.Address = fmt.Sprintf("%s:%d", clientAddr, in.GetPort())
		workerEntity.Status = persistence.WorkerStatusActive
	} else {
		workerEntity = &persistence.Worker{
			ID:      in.GetId(),
			Address: fmt.Sprintf("%s:%d", clientAddr, in.GetPort()),
			Status:  persistence.WorkerStatusActive,
		}
	}

	if err = c.workerRepo.AddOrActivate(workerEntity); err != nil {
		log.Error().Err(err).Str("worker_id", in.GetId()).Msg("Failed to register worker")
		return nil, status.Error(codes.Internal, "failed to register worker")
	}

	log.Info().Str("worker_id", workerEntity.ID).Str("address", workerEntity.Address).Msg("Worker registered")

	return &pb.CommonResponse{
		Message: "Worker registered successfully",
	}, nil
}

func (c *CoordinatorAPI) DeregisterWorker(_ context.Context, in *pb.DeregisterWorkerRequest) (*pb.CommonResponse, error) {
	err := c.workerRepo.Deactivate(in.GetId())
	if err != nil {
		log.Error().Err(err).Str("worker_id", in.GetId()).Msg("Failed to deregister")
		return nil, status.Error(codes.Internal, "failed to deregister worker")
	}

	return &pb.CommonResponse{Message: "Worker deregistered successfully"}, nil
}

func (c *CoordinatorAPI) ListWorkers(_ context.Context, in *pb.ListWorkersRequest) (*pb.ListWorkersResponse, error) {
	if err := in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	workerStatuses := []persistence.WorkerStatus{persistence.WorkerStatusActive, persistence.WorkerStatusInactive}

	if in.GetStatus() != "all" {
		workerStatuses = []persistence.WorkerStatus{persistence.WorkerStatus(in.GetStatus())}
	}

	workers, err := c.workerRepo.FindAllByStatuses(workerStatuses...)
	if err != nil {
		log.Error().Err(err).Msg("Failed to list workers")
		return nil, status.Error(codes.Internal, "failed to list workers")
	}

	result := &pb.ListWorkersResponse{
		Data: make([]*pb.ListWorkersResponse_Worker, 0, len(workers)),
	}

	for _, worker := range workers {
		result.Data = append(result.Data, &pb.ListWorkersResponse_Worker{
			Id:            worker.ID,
			Address:       worker.Address,
			LastHeartbeat: timestamppb.New(worker.LastHeartbeat),
			Status:        string(worker.Status),
		})
	}

	return result, nil
}
