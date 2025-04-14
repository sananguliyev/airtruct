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
	ID             int             `json:"id" gorm:"primaryKey"`
	StreamID       int             `json:"stream_id" gorm:"not null"`
	WorkerStreamID int             `json:"worker_stream_id" gorm:"not null"`
	ComponentID    int             `json:"component_id"`
	ComponentName  string          `json:"component_name"`
	Type           EventType       `json:"type" gorm:"not null"`
	Content        string          `json:"content" gorm:"not null"`
	Meta           json.RawMessage `json:"meta" gorm:"not null"`
	CreatedAt      time.Time       `json:"created_at"`

	Stream    Stream           `json:"stream" gorm:"foreignKey:StreamID"`
	Component *ComponentConfig `json:"component" gorm:"foreignKey:ComponentID"`
}

type EventRepository interface {
	AddEvent(event Event) error
	ListEventsByWorker(workerID string, preload bool) ([]Event, error)
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) AddEvent(event Event) error {
	event.CreatedAt = time.Now()
	return r.db.Create(&event).Error
}

func (r *eventRepository) ListEventsByWorker(workerID string, preload bool) ([]Event, error) {
	var events []Event
	query := r.db.Where("worker_id = ?", workerID)
	if preload {
		query = query.Preload("Stream").Preload("ComponentConfig")
	}
	err := query.Find(&events).Error
	if err != nil {
		return nil, err
	}
	return events, nil
}
