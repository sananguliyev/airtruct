package persistence

import (
	"time"

	"gorm.io/gorm"
)

type WorkerStreamStatus string

const (
	WorkerStreamStatusWaiting  WorkerStreamStatus = "waiting"
	WorkerStreamStatusRunning  WorkerStreamStatus = "running"
	WorkerStreamStatusStopped  WorkerStreamStatus = "stopped"
	WorkerStreamStatusFinished WorkerStreamStatus = "finished"
	WorkerStreamStatusFailed   WorkerStreamStatus = "failed"
)

type WorkerStream struct {
	ID        int                `json:"id" gorm:"primaryKey"`
	WorkerID  string             `json:"worker_id" gorm:"not null"`
	StreamID  int                `json:"stream_id" gorm:"not null"`
	Status    WorkerStreamStatus `json:"status" gorm:"not null"`
	CreatedAt time.Time          `json:"created_at" gorm:"not null"`
	UpdatedAt time.Time          `json:"updated_at"`

	Worker Worker `json:"worker" gorm:"foreignKey:WorkerID"`
	Stream Stream `json:"stream" gorm:"foreignKey:StreamID"`
}

type WorkerStreamRepository interface {
	Queue(workerID string, streamID int) (WorkerStream, error)
	UpdateStatus(id int, status WorkerStreamStatus) error
	StopAllByWorkerID(workerID string) error
	ListAllByWorkerID(workerID string) ([]WorkerStream, error)
	ListAllByStreamID(streamID int) ([]WorkerStream, error)
	ListAllByStatuses(statuses ...WorkerStreamStatus) ([]WorkerStream, error)
}

type workerStreamRepository struct {
	db *gorm.DB
}

func NewWorkerStreamRepository(db *gorm.DB) WorkerStreamRepository {
	return &workerStreamRepository{db: db}
}

func (r *workerStreamRepository) Queue(workerID string, streamID int) (WorkerStream, error) {
	workerStream := WorkerStream{
		WorkerID:  workerID,
		StreamID:  streamID,
		Status:    WorkerStreamStatusWaiting,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := r.db.Create(&workerStream).Error

	return workerStream, err
}

func (r *workerStreamRepository) UpdateStatus(id int, status WorkerStreamStatus) error {
	return r.db.
		Model(&WorkerStream{}).
		Where("id = ?", id).
		Updates(map[string]any{"status": status, "updated_at": time.Now()}).
		Error
}

func (r *workerStreamRepository) StopAllByWorkerID(workerID string) error {
	return r.db.
		Model(&WorkerStream{}).
		Where("worker_id = ?", workerID).
		Updates(map[string]any{"status": WorkerStreamStatusStopped, "updated_at": time.Now()}).
		Error
}

func (r *workerStreamRepository) ListAllByWorkerID(workerID string) ([]WorkerStream, error) {
	var workerStreams []WorkerStream
	err := r.db.
		Preload("Worker").
		Preload("Stream").
		Preload("Output").
		Where("worker_id = ?", workerID).
		Find(&workerStreams).
		Error

	return workerStreams, err
}

func (r *workerStreamRepository) ListAllByStreamID(streamID int) ([]WorkerStream, error) {
	var workerStreams []WorkerStream
	err := r.db.
		Preload("Worker").
		Preload("Stream").
		Preload("Output").
		Where("stream_id = ?", streamID).
		Find(&workerStreams).
		Error

	return workerStreams, err
}

func (r *workerStreamRepository) ListAllByStatuses(statuses ...WorkerStreamStatus) ([]WorkerStream, error) {
	var workerStreams []WorkerStream
	err := r.db.
		Preload("Stream").
		Preload("Worker").
		Where("status IN ?", statuses).
		Find(&workerStreams).
		Error

	return workerStreams, err
}
