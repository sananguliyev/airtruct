package persistence

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WorkerStatus string

const (
	WorkerStatusActive   = "active"
	WorkerStatusInactive = "inactive"
)

type Worker struct {
	ID            string       `gorm:"primaryKey" json:"id"`
	Address       string       `json:"address"`
	LastHeartbeat time.Time    `json:"last_heartbeat"`
	Status        WorkerStatus `json:"status"`

	RunningStreamCount int `gorm:"-" json:"running_stream_count"`
}

type WorkerRepository interface {
	FindAllByStatuses(...WorkerStatus) ([]Worker, error)
	FindAllActiveWithRunningStreamCount() ([]Worker, error)
	FindByID(id string) (*Worker, error)
	AddOrActivate(worker *Worker) error
	Deactivate(id string) error
}

type workerRepository struct {
	db *gorm.DB
}

func NewWorkerRepository(db *gorm.DB) WorkerRepository {
	return &workerRepository{db: db}
}

func (r *workerRepository) FindAllByStatuses(statuses ...WorkerStatus) ([]Worker, error) {
	var workers []Worker
	err := r.db.
		Where("status IN ?", statuses).
		Order("last_heartbeat DESC").
		Find(&workers).
		Error
	if err != nil {
		return nil, err
	}
	return workers, nil
}

func (r *workerRepository) FindAllActiveWithRunningStreamCount() ([]Worker, error) {
	var workers []Worker

	// Subquery to count running streams for each worker.
	subQuery := r.db.Model(&WorkerStream{}).
		Select("worker_id, COUNT(stream_id) as running_stream_count").
		Where("status = ?", WorkerStreamStatusRunning).
		Group("worker_id")

	// Main query to find workers and join the subquery result.
	err := r.db.Model(&Worker{}).
		Select("workers.*, COALESCE(running_stream_count, 0) as RunningStreamCount").
		Joins("LEFT JOIN (?) as s ON workers.id = s.worker_id", subQuery).
		Where("status = ?", WorkerStatusActive).
		Find(&workers).
		Error

	if err != nil {
		return nil, err
	}

	return workers, nil
}

func (r *workerRepository) FindByID(id string) (*Worker, error) {
	var node = &Worker{
		ID: id,
	}
	err := r.db.First(node).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	return node, nil
}

func (r *workerRepository) AddOrActivate(worker *Worker) error {
	worker.LastHeartbeat = time.Now()
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status", "address"}),
	}).Create(worker).Error
}

func (r *workerRepository) Deactivate(id string) error {
	return r.db.
		Model(&Worker{}).
		Where("id = ?", id).
		Update("status", WorkerStatusInactive).Error
}
