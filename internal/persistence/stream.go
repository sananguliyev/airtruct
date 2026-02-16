package persistence

import (
	"errors"
	"time"

	pb "github.com/sananguliyev/airtruct/internal/protogen"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"
)

type StreamStatus string
type StreamSection string

const (
	StreamStatusActive    StreamStatus = "active"
	StreamStatusCompleted StreamStatus = "completed"
	StreamStatusPaused    StreamStatus = "paused"
	StreamStatusFailed    StreamStatus = "failed"

	StreamSectionInput    StreamSection = "input"
	StreamSectionPipeline StreamSection = "pipeline"
	StreamSectionOutput   StreamSection = "output"
)

type Stream struct {
	ID              int64        `json:"id" gorm:"primaryKey"`
	ParentID        *int64       `json:"parent_id"`
	Name            string       `json:"name" gorm:"not null"`
	InputLabel      string       `json:"input_label"`
	InputComponent  string       `json:"input_component" gorm:"not null"`
	InputConfig     []byte       `json:"input_config" gorm:"not null"`
	OutputLabel     string       `json:"output_label"`
	OutputComponent string       `json:"output_component" gorm:"not null"`
	OutputConfig    []byte       `json:"output_config" gorm:"not null"`
	BufferID        *int64       `json:"buffer_id"`
	IsCurrent       bool         `json:"is_current" gorm:"default:true"`
	Status          StreamStatus `json:"status" gorm:"not null"`
	CreatedAt       time.Time    `json:"created_at" gorm:"not null"`
	UpdatedAt       *time.Time   `json:"updated_at"`

	ParentStream *Stream           `json:"parent_stream" gorm:"foreignKey:ParentID"`
	Buffer       *Buffer           `json:"buffer" gorm:"foreignKey:BufferID"`
	Processors   []StreamProcessor `json:"processors" gorm:"foreignKey:StreamID;references:ID"`
	Caches       []StreamCache     `json:"caches" gorm:"foreignKey:StreamID;references:ID"`
}

func (s *Stream) ToProto() *pb.Stream {
	var updatedAt *timestamppb.Timestamp
	if s.UpdatedAt != nil {
		updatedAt = timestamppb.New(*s.UpdatedAt)
	}

	result := &pb.Stream{
		Id:              s.ID,
		ParentId:        s.ParentID,
		Name:            s.Name,
		InputLabel:      s.InputLabel,
		InputComponent:  s.InputComponent,
		InputConfig:     string(s.InputConfig),
		Processors:      make([]*pb.Stream_Processor, len(s.Processors)),
		OutputLabel:     s.OutputLabel,
		OutputComponent: s.OutputComponent,
		OutputConfig:    string(s.OutputConfig),
		BufferId:        s.BufferID,
		IsCurrent:       s.IsCurrent,
		Status:          string(s.Status),
		CreatedAt:       timestamppb.New(s.CreatedAt),
		UpdatedAt:       updatedAt,
		IsHttpServer:    s.InputComponent == "http_server",
	}

	for i, processor := range s.Processors {
		result.Processors[i] = &pb.Stream_Processor{
			Label:     processor.Label,
			Component: processor.Component,
			Config:    string(processor.Config),
		}
	}

	return result
}

func (s *Stream) FromProto(p *pb.Stream) {
	updatedAt := p.GetUpdatedAt().AsTime()

	s.ID = p.Id
	s.ParentID = p.ParentId
	s.Name = p.Name
	s.InputLabel = p.InputLabel
	s.InputComponent = p.InputComponent
	s.InputConfig = []byte(p.InputConfig)
	s.OutputLabel = p.OutputLabel
	s.OutputComponent = p.OutputComponent
	s.OutputConfig = []byte(p.OutputConfig)
	s.BufferID = p.BufferId
	s.IsCurrent = p.GetIsCurrent()
	s.Status = StreamStatus(p.GetStatus())
	s.CreatedAt = p.CreatedAt.AsTime()
	s.UpdatedAt = &updatedAt
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
		Preload("Processors").
		Preload("Caches").
		Preload("Buffer").
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
		Preload("Processors").
		Preload("Caches").
		Preload("Buffer")

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
		Preload("Processors").
		Preload("Caches").
		Preload("Buffer").
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
