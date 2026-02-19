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
	StreamID       int64           `json:"stream_id"`
	FlowID         string          `json:"flow_id"`
	Section        string          `json:"section" gorm:"not null"`
	ComponentLabel string          `json:"component_label"`
	Type           EventType       `json:"type" gorm:"not null"`
	Content        string          `json:"content" gorm:"not null"`
	Meta           json.RawMessage `json:"meta" gorm:"not null"`
	CreatedAt      time.Time       `json:"created_at"`

	Worker WorkerStream `json:"worker" gorm:"foreignKey:WorkerStreamID"`
}

type EventRepository interface {
	AddEvent(event *Event) error
	ListEventsByWorkerStream(workerID int64, preload bool) ([]*Event, error)
	ListEventsByStreamIDs(streamIDs []int64, limit, offset int, startTime, endTime time.Time) ([]*Event, int64, error)
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

func (r *eventRepository) ListEventsByStreamIDs(streamIDs []int64, limit, offset int, startTime, endTime time.Time) ([]*Event, int64, error) {
	var events []*Event
	var totalFlows int64

	baseWhere := "stream_id IN ? AND flow_id != ''"
	baseArgs := []any{streamIDs}

	if !startTime.IsZero() {
		baseWhere += " AND created_at >= ?"
		baseArgs = append(baseArgs, startTime)
	}
	if !endTime.IsZero() {
		baseWhere += " AND created_at <= ?"
		baseArgs = append(baseArgs, endTime)
	}

	// Count distinct flow_ids for pagination
	if err := r.db.Model(&Event{}).
		Where(baseWhere, baseArgs...).
		Distinct("flow_id").
		Count(&totalFlows).Error; err != nil {
		return nil, 0, err
	}

	// Find the N most recent flow_ids (by their latest event timestamp)
	type flowResult struct {
		FlowID string
	}
	var flowIDs []flowResult
	if err := r.db.Model(&Event{}).
		Select("flow_id, MAX(created_at) as max_ts").
		Where(baseWhere, baseArgs...).
		Group("flow_id").
		Order("max_ts DESC").
		Limit(limit).
		Offset(offset).
		Find(&flowIDs).Error; err != nil {
		return nil, 0, err
	}

	if len(flowIDs) == 0 {
		return events, totalFlows, nil
	}

	// Fetch ALL events for the selected flow_ids
	ids := make([]string, len(flowIDs))
	for i, f := range flowIDs {
		ids[i] = f.FlowID
	}

	if err := r.db.
		Where("flow_id IN ?", ids).
		Order("created_at DESC").
		Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, totalFlows, nil
}
