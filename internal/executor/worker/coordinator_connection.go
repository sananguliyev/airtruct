package worker

import (
	"context"
	"os"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

type CoordinatorConnection interface {
	JoinToCoordinator(ctx context.Context) error
	LeaveCoordinator(ctx context.Context) error
	GetClient() pb.CoordinatorClient
	UpdateWorkerStreamStatus(ctx context.Context, workerStreamID int64, status pb.WorkerStreamStatus) error
	IngestMetrics(ctx context.Context, workerStreamID int64, inputEvents, processorErrors, outputEvents uint64) error
}

type coordinatorConnection struct {
	mu                sync.Mutex
	clientConn        *grpc.ClientConn
	coordinatorClient pb.CoordinatorClient
	grpcPort          uint32
	joined            bool
}

func NewCoordinatorConnection(discoveryUri string, grpcPort uint32) CoordinatorConnection {
	grpcConn, err := grpc.NewClient(discoveryUri, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create grpc client")
	}

	coordinatorGRPCClient := pb.NewCoordinatorClient(grpcConn)

	connection := &coordinatorConnection{
		clientConn:        grpcConn,
		coordinatorClient: coordinatorGRPCClient,
		grpcPort:          grpcPort,
		joined:            false,
	}

	go connection.monitorConnection()

	return connection
}

func (c *coordinatorConnection) monitorConnection() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		state := c.clientConn.GetState()
		if state == connectivity.TransientFailure || state == connectivity.Shutdown {
			log.Warn().Str("state", state.String()).Msg("gRPC connection is down")
			c.mu.Lock()
			c.joined = false
			c.mu.Unlock()
		}
	}
}

func (c *coordinatorConnection) JoinToCoordinator(ctx context.Context) error {
	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	c.mu.Lock()
	if c.joined {
		log.Debug().Str("worker_id", hostname).Msg("Worker already joined to coordinator")
		c.mu.Unlock()
		return nil
	}
	c.mu.Unlock()

	r, err := c.coordinatorClient.RegisterWorker(ctx, &pb.RegisterWorkerRequest{
		Id:   hostname,
		Port: c.grpcPort,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to register on coordinator")
		return err
	}

	c.mu.Lock()
	c.joined = true
	c.mu.Unlock()

	log.Info().Str("worker_id", hostname).Msg(r.GetMessage())
	return nil
}

func (c *coordinatorConnection) LeaveCoordinator(ctx context.Context) error {
	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	resp, err := c.coordinatorClient.DeregisterWorker(ctx, &pb.DeregisterWorkerRequest{Id: hostname})
	if err != nil {
		return err
	}

	c.mu.Lock()
	c.joined = false
	c.mu.Unlock()

	log.Info().Str("worker_id", hostname).Str("coordinator_response", resp.Message).Msg("Left coordinator")
	return nil
}

func (c *coordinatorConnection) GetClient() pb.CoordinatorClient {
	return c.coordinatorClient
}

func (c *coordinatorConnection) UpdateWorkerStreamStatus(ctx context.Context, workerStreamID int64, status pb.WorkerStreamStatus) error {
	resp, err := c.coordinatorClient.UpdateWorkerStreamStatus(
		ctx,
		&pb.WorkerStreamStatusRequest{
			WorkerStreamId: workerStreamID,
			Status:         status,
		},
	)
	if err != nil {
		return err
	}

	log.Info().
		Int64("worker_stream_id", workerStreamID).
		Str("coordinator_response", resp.Message).
		Msg("Updated worker stream status")

	return nil
}

func (c *coordinatorConnection) IngestMetrics(ctx context.Context, workerStreamID int64, inputEvents, processorErrors, outputEvents uint64) error {
	_, err := c.coordinatorClient.IngestMetrics(ctx, &pb.MetricsRequest{
		WorkerStreamId:  workerStreamID,
		InputEvents:     inputEvents,
		ProcessorErrors: processorErrors,
		OutputEvents:    outputEvents,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to send metrics")
		return err
	}

	return nil
}
