package worker

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"

	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

const (
	MaxItemsInStreamQueue = 10
	StreamMaxDelay        = 30 * time.Second
)

type StreamQueueItem struct {
	WorkerStreamID int64
	Config         string
	Files          []*pb.StreamFile
}

type StreamQueue interface {
	AddStreamToQueue(workerStreamID int64, config string, files []*pb.StreamFile) error
	ConsumeStreamQueue(ctx context.Context)
}

type streamQueue struct {
	queue         chan StreamQueueItem
	streamManager StreamManager
}

func NewStreamQueue(streamManager StreamManager) StreamQueue {
	return &streamQueue{
		queue:         make(chan StreamQueueItem, MaxItemsInStreamQueue),
		streamManager: streamManager,
	}
}

func (q *streamQueue) AddStreamToQueue(workerStreamID int64, config string, files []*pb.StreamFile) error {
	item := StreamQueueItem{
		WorkerStreamID: workerStreamID,
		Config:         config,
		Files:          files,
	}

	select {
	case q.queue <- item:
		log.Info().Int64("worker_stream_id", workerStreamID).Msg("Stream added to queue")
		return nil
	case <-time.After(StreamMaxDelay):
		log.Error().Int64("worker_stream_id", workerStreamID).Msg("Failed to add stream to queue: timeout")
		return ErrStreamQueueTimeout
	}
}

func (q *streamQueue) ConsumeStreamQueue(ctx context.Context) {
	for {
		select {
		case item := <-q.queue:
			log.Info().Int64("worker_stream_id", item.WorkerStreamID).Msg("Processing stream from queue")

			if err := q.streamManager.WriteFiles(item.Files); err != nil {
				log.Error().Err(err).Int64("worker_stream_id", item.WorkerStreamID).Msg("Failed to write files to disk")
				continue
			}

			if err := q.streamManager.AddStream(item.WorkerStreamID, item.Config); err != nil {
				log.Error().Err(err).Int64("worker_stream_id", item.WorkerStreamID).Msg("Failed to add stream to manager")
				continue
			}

			q.streamManager.StartStream(ctx, item.WorkerStreamID)

		case <-ctx.Done():
			log.Info().Msg("Stopping stream queue processing...")
			q.streamManager.StopAllStreams()

			time.Sleep(1 * time.Second)

			log.Info().Msg("Stream queue processing stopped")
			return
		}
	}
}

var (
	ErrStreamQueueTimeout = fmt.Errorf("stream queue timeout")
)
