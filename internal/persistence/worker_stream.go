package persistence

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type WorkerStreamStatus string

const (
	WorkerStreamStatusWaiting   WorkerStreamStatus = "waiting"
	WorkerStreamStatusRunning   WorkerStreamStatus = "running"
	WorkerStreamStatusStopped   WorkerStreamStatus = "stopped"
	WorkerStreamStatusCompleted WorkerStreamStatus = "completed"
	WorkerStreamStatusFailed    WorkerStreamStatus = "failed"
)

const (
	StreamLeaseInterval = 20 * time.Second
)

type WorkerStream struct {
	ID              int64              `json:"id" gorm:"primaryKey"`
	WorkerID        string             `json:"worker_id" gorm:"not null"`
	StreamID        int64              `json:"stream_id" gorm:"not null"`
	InputEvents     uint64             `json:"input_events" gorm:"not null" default:"0"`
	ProcessorErrors uint64             `json:"processor_errors" gorm:"not null" default:"0"`
	OutputEvents    uint64             `json:"output_events" gorm:"not null" default:"0"`
	Status          WorkerStreamStatus `json:"status" gorm:"not null"`
	LeaseExpiresAt  time.Time          `json:"lease_expires_at"`
	CreatedAt       time.Time          `json:"created_at" gorm:"not null"`
	UpdatedAt       time.Time          `json:"updated_at"`

	Worker Worker `json:"worker" gorm:"foreignKey:WorkerID"`
	Stream Stream `json:"stream" gorm:"foreignKey:StreamID"`
}

type WorkerStreamRepository interface {
	Queue(workerID string, streamID int64) (WorkerStream, error)
	FindByID(id int64) (*WorkerStream, error)
	FindByWorkerIDAndStreamID(workerID string, streamID int64) (*WorkerStream, error)
	UpdateStatus(id int64, status WorkerStreamStatus) error
	UpdateMetrics(id int64, inputEvents, processorErrors, outputEvents uint64) error
	UpdateLeaseExpiry(id int64, expiresAt time.Time) error
	FindRunningWithExpiredLeases() ([]WorkerStream, error)
	StopAllRunningAndWaitingByWorkerID(workerID string) error
	ListAllByWorkerID(workerID string) ([]WorkerStream, error)
	ListAllByStreamID(streamID int64) ([]WorkerStream, error)
	ListAllByStatuses(statuses ...WorkerStreamStatus) ([]WorkerStream, error)
}

type workerStreamRepository struct {
	db *gorm.DB
}

func NewWorkerStreamRepository(db *gorm.DB) WorkerStreamRepository {
	return &workerStreamRepository{db: db}
}

func (r *workerStreamRepository) Queue(workerID string, streamID int64) (WorkerStream, error) {
	workerStream := WorkerStream{
		WorkerID:       workerID,
		StreamID:       streamID,
		Status:         WorkerStreamStatusWaiting,
		LeaseExpiresAt: time.Now().Add(StreamLeaseInterval),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	err := r.db.Create(&workerStream).Error

	return workerStream, err
}

func (r *workerStreamRepository) UpdateStatus(id int64, status WorkerStreamStatus) error {
	return r.db.
		Model(&WorkerStream{}).
		Where("id = ?", id).
		Updates(map[string]any{"status": status, "updated_at": time.Now()}).
		Error
}

func (r *workerStreamRepository) UpdateMetrics(id int64, inputEvents, processorErrors, outputEvents uint64) error {
	return r.db.
		Model(&WorkerStream{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"input_events":     inputEvents,
			"processor_errors": processorErrors,
			"output_events":    outputEvents,
			"updated_at":       time.Now(),
		}).
		Error
}

func (r *workerStreamRepository) FindByID(id int64) (*WorkerStream, error) {
	var workerStream = &WorkerStream{
		ID: id,
	}
	err := r.db.
		Preload("Worker").
		Preload("Stream").
		First(workerStream).
		Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	return workerStream, nil
}

func (r *workerStreamRepository) StopAllRunningAndWaitingByWorkerID(workerID string) error {
	return r.db.
		Model(&WorkerStream{}).
		Where("worker_id = ?", workerID).
		Where("status IN ?", []WorkerStreamStatus{WorkerStreamStatusRunning, WorkerStreamStatusWaiting}).
		Updates(map[string]any{"status": WorkerStreamStatusStopped, "updated_at": time.Now()}).
		Error
}

func (r *workerStreamRepository) FindByWorkerIDAndStreamID(workerID string, streamID int64) (*WorkerStream, error) {
	var workerStream WorkerStream
	err := r.db.
		Where("worker_id = ? AND stream_id = ?", workerID, streamID).
		First(&workerStream).
		Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &workerStream, nil
}

func (r *workerStreamRepository) UpdateLeaseExpiry(id int64, expiresAt time.Time) error {
	return r.db.
		Model(&WorkerStream{}).
		Where("id = ?", id).
		Update("lease_expires_at", expiresAt).
		Error
}

func (r *workerStreamRepository) FindRunningWithExpiredLeases() ([]WorkerStream, error) {
	var streams []WorkerStream
	err := r.db.
		Where("status = ?", WorkerStreamStatusRunning).
		Where("lease_expires_at != ?", time.Time{}).
		Where("lease_expires_at < ?", time.Now()).
		Find(&streams).
		Error
	if err != nil {
		return nil, err
	}
	return streams, nil
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

func (r *workerStreamRepository) ListAllByStreamID(streamID int64) ([]WorkerStream, error) {
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
