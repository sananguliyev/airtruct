package persistence

import (
	"time"

	"gorm.io/gorm"
)

type StreamRateLimit struct {
	ID          int64     `json:"id" gorm:"primaryKey"`
	StreamID    int64     `json:"stream_id" gorm:"not null"`
	RateLimitID int64     `json:"rate_limit_id" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"not null"`

	Stream    Stream    `json:"stream" gorm:"foreignKey:StreamID"`
	RateLimit RateLimit `json:"rate_limit" gorm:"foreignKey:RateLimitID"`
}

type StreamRateLimitRepository interface {
	Create(streamRateLimit StreamRateLimit) error
	FindByStreamID(streamID int64) ([]StreamRateLimit, error)
	DeleteByStreamID(streamID int64) error
}

type streamRateLimitRepository struct {
	db *gorm.DB
}

func NewStreamRateLimitRepository(db *gorm.DB) StreamRateLimitRepository {
	return &streamRateLimitRepository{db: db}
}

func (r *streamRateLimitRepository) Create(streamRateLimit StreamRateLimit) error {
	streamRateLimit.CreatedAt = time.Now()
	return r.db.Create(&streamRateLimit).Error
}

func (r *streamRateLimitRepository) FindByStreamID(streamID int64) ([]StreamRateLimit, error) {
	var streamRateLimits []StreamRateLimit
	err := r.db.Preload("RateLimit").Where("stream_id = ?", streamID).Find(&streamRateLimits).Error
	return streamRateLimits, err
}

func (r *streamRateLimitRepository) DeleteByStreamID(streamID int64) error {
	return r.db.Where("stream_id = ?", streamID).Delete(&StreamRateLimit{}).Error
}
