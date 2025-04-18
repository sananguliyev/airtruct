package persistence

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type StreamStatus string

const (
	StreamStatusActive    StreamStatus = "active"
	StreamStatusCompleted StreamStatus = "completed"
	StreamStatusPaused    StreamStatus = "paused"
	StreamStatusFailed    StreamStatus = "failed"
)

type Stream struct {
	ID          int64        `json:"id" gorm:"primaryKey"`
	ParentID    *int64       `json:"parent_id"`
	Name        string       `json:"name" gorm:"not null"`
	InputLabel  string       `json:"input_label"`
	InputID     int64        `json:"input_id" gorm:"not null"`
	OutputLabel string       `json:"output_label"`
	OutputID    int64        `json:"output_id" gorm:"not null"`
	IsCurrent   bool         `json:"is_current" gorm:"default:true"`
	Status      StreamStatus `json:"status" gorm:"not null"`
	CreatedAt   time.Time    `json:"created_at" gorm:"not null"`
	UpdatedAt   *time.Time   `json:"updated_at"`

	ParentStream *Stream           `json:"parent_stream" gorm:"foreignKey:ParentID"`
	Input        ComponentConfig   `json:"input" gorm:"foreignKey:InputID"`
	Output       ComponentConfig   `json:"output" gorm:"foreignKey:OutputID"`
	Processors   []StreamProcessor `json:"processors" gorm:"foreignKey:StreamID;references:ID"`
}

type StreamRepository interface {
	Create(stream *Stream) error
	Update(stream *Stream) error
	FindByID(id int64) (*Stream, error)
	UpdateStatus(id int64, status StreamStatus) error
	Delete(id int64) error
	ListAllByStatuses(...StreamStatus) ([]Stream, error)
	ListAllActiveAndNonAssigned() ([]Stream, error)
}

type streamRepository struct {
	db *gorm.DB
}

func NewStreamRepository(db *gorm.DB) StreamRepository {
	return &streamRepository{db: db}
}

func (r *streamRepository) Create(stream *Stream) error {
	stream.CreatedAt = time.Now()
	return r.db.Create(stream).Error
}

func (r *streamRepository) Update(stream *Stream) error {
	var err error

	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	err = tx.
		Model(&Stream{}).
		Where("id = ?", stream.ID).
		Update("is_current", false).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	var id = stream.ID
	stream.CreatedAt = time.Now()
	if stream.ParentID == nil {
		stream.ParentID = &id
	}
	stream.ID = 0

	if err = tx.Create(stream).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (r *streamRepository) FindByID(id int64) (*Stream, error) {
	var stream = &Stream{
		ID: id,
	}
	err := r.db.
		Preload("Input").
		Preload("Output").
		Preload("Processors").
		Preload("Processors.Processor").
		Preload("ParentStream").
		First(stream).
		Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	return stream, nil
}

func (r *streamRepository) UpdateStatus(id int64, status StreamStatus) error {
	return r.db.
		Model(&Stream{}).
		Where("id = ?", id).
		Updates(map[string]any{"status": status, "updated_at": time.Now()}).
		Error
}

func (r *streamRepository) Delete(id int64) error {
	return r.db.Delete(&Stream{}, id).Error
}

func (r *streamRepository) ListAllByStatuses(statuses ...StreamStatus) ([]Stream, error) {
	var streams []Stream
	db := r.db.
		Preload("Input").
		Preload("Output").
		Preload("Processors")

	if len(statuses) > 0 {
		db = db.Where("is_current = true AND status IN ?", statuses)
	}

	if err := db.Find(&streams).Error; err != nil {
		return nil, err
	}
	return streams, nil
}

func (r *streamRepository) ListAllActiveAndNonAssigned() ([]Stream, error) {
	var streams []Stream

	err := r.db.
		Preload("Input").
		Preload("Output").
		Preload("Processors").
		Preload("Processors.Processor").
		Where("is_current = true AND status = ?", StreamStatusActive).
		Where(
			"NOT EXISTS (?)",
			r.db.
				Model(&WorkerStream{}).Select("1").
				Where(
					"worker_streams.stream_id = streams.id AND worker_streams.status IN ?",
					[]WorkerStreamStatus{WorkerStreamStatusWaiting, WorkerStreamStatusRunning, WorkerStreamStatusCompleted},
				),
		).
		Find(&streams).Error

	if err != nil {
		return nil, err
	}

	return streams, nil
}
