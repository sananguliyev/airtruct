package coordinator

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/zerolog/log"
	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protorender"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

func (c *CoordinatorAPI) RegisterWorker(ctx context.Context, in *pb.RegisterWorkerRequest) (*pb.RegisterWorkerResponse, error) {
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

	if ip := net.ParseIP(tcpAddr.IP.String()); ip != nil {
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
		return &pb.RegisterWorkerResponse{
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

	return &pb.RegisterWorkerResponse{
		Message: "Worker registered successfully",
	}, nil
}

func (c *CoordinatorAPI) DeregisterWorker(ctx context.Context, in *pb.DeregisterWorkerRequest) (*pb.DeregisterWorkerResponse, error) {
	err := c.workerRepo.Deactivate(in.GetId())
	if err != nil {
		log.Error().Err(err).Str("worker_id", in.GetId()).Msg("Failed to deregister")
		return nil, status.Error(codes.Internal, "failed to deregister worker")
	}

	return &pb.DeregisterWorkerResponse{Message: "Worker deregistered successfully"}, nil
}

func (c *CoordinatorAPI) ListWorkers(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	workerStatuses := []persistence.WorkerStatus{persistence.WorkerStatusActive, persistence.WorkerStatusInactive}

	if ps.ByName("workerStatuses") != "all" {
		workerStatuses = []persistence.WorkerStatus{persistence.WorkerStatus(ps.ByName("name"))}
	}

	workers, err := c.workerRepo.FindAllByStatuses(workerStatuses...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(workers); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
