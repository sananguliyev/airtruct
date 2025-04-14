package persistence

import (
	"time"

	"gorm.io/gorm"
)

type StreamProcessor struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	StreamID    int       `json:"stream_id" gorm:"not null"`
	ProcessorID int       `json:"processor_id" gorm:"not null"`
	Label       string    `json:"label"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null"`

	Stream    Stream          `json:"stream" gorm:"foreignKey:StreamID"`
	Processor ComponentConfig `json:"processor" gorm:"foreignKey:ProcessorID"`
}

type StreamProcessorRepository interface {
	Create(streamProcessor StreamProcessor) error
}

type streamProcessorRepository struct {
	db *gorm.DB
}

func NewStreamProcessorRepository(db *gorm.DB) StreamProcessorRepository {
	return &streamProcessorRepository{db: db}
}

func (r *streamProcessorRepository) Create(streamProcessor StreamProcessor) error {
	streamProcessor.CreatedAt = time.Now()
	return r.db.Create(&streamProcessor).Error
}
