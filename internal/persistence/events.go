package persistence

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type EventType string

const (
	EventTypeProduce EventType = "PRODUCE"
	EventTypeConsume EventType = "CONSUME"
	EventTypeDelete  EventType = "DELETE"
	EventTypeError   EventType = "ERROR"
	EventTypeUnknown EventType = "UNKNOWN"
)

type Event struct {
	ID             int64           `json:"id" gorm:"primaryKey"`
	WorkerStreamID int64           `json:"worker_stream_id" gorm:"not null"`
	Section        string          `json:"section" gorm:"not null"`
	ComponentName  string          `json:"component_name"`
	Type           EventType       `json:"type" gorm:"not null"`
	Content        string          `json:"content" gorm:"not null"`
	Meta           json.RawMessage `json:"meta" gorm:"not null"`
	CreatedAt      time.Time       `json:"created_at"`

	Worker WorkerStream `json:"worker" gorm:"foreignKey:WorkerStreamID"`
}

type EventRepository interface {
	AddEvent(event *Event) error
	ListEventsByWorkerStream(workerID int64, preload bool) ([]*Event, error)
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) AddEvent(event *Event) error {
	event.CreatedAt = time.Now()
	return r.db.Create(event).Error
}

func (r *eventRepository) ListEventsByWorkerStream(workerStreamID int64, preload bool) ([]*Event, error) {
	var events []*Event
	query := r.db.Where("worker_stream_id = ?", workerStreamID)
	if preload {
		query = query.Preload("WorkerStream")
	}
	err := query.Find(&events).Error
	if err != nil {
		return nil, err
	}
	return events, nil
}
