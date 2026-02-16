package persistence

import (
	"time"

	"gorm.io/gorm"
)

type StreamBuffer struct {
	ID        int64     `json:"id" gorm:"primaryKey"`
	StreamID  int64     `json:"stream_id" gorm:"not null"`
	BufferID  int64     `json:"buffer_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"not null"`

	Stream Stream `json:"stream" gorm:"foreignKey:StreamID"`
	Buffer Buffer `json:"buffer" gorm:"foreignKey:BufferID"`
}

type StreamBufferRepository interface {
	Create(streamBuffer StreamBuffer) error
	FindByStreamID(streamID int64) ([]StreamBuffer, error)
	DeleteByStreamID(streamID int64) error
}

type streamBufferRepository struct {
	db *gorm.DB
}

func NewStreamBufferRepository(db *gorm.DB) StreamBufferRepository {
	return &streamBufferRepository{db: db}
}

func (r *streamBufferRepository) Create(streamBuffer StreamBuffer) error {
	streamBuffer.CreatedAt = time.Now()
	return r.db.Create(&streamBuffer).Error
}

func (r *streamBufferRepository) FindByStreamID(streamID int64) ([]StreamBuffer, error) {
	var streamBuffers []StreamBuffer
	err := r.db.Preload("Buffer").Where("stream_id = ?", streamID).Find(&streamBuffers).Error
	return streamBuffers, err
}

func (r *streamBufferRepository) DeleteByStreamID(streamID int64) error {
	return r.db.Where("stream_id = ?", streamID).Delete(&StreamBuffer{}).Error
}
