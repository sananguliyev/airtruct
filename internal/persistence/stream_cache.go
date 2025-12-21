package persistence

import (
	"time"

	"gorm.io/gorm"
)

type StreamCache struct {
	ID        int64     `json:"id" gorm:"primaryKey"`
	StreamID  int64     `json:"stream_id" gorm:"not null"`
	CacheID   int64     `json:"cache_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"not null"`

	Stream Stream `json:"stream" gorm:"foreignKey:StreamID"`
	Cache  Cache  `json:"cache" gorm:"foreignKey:CacheID"`
}

type StreamCacheRepository interface {
	Create(streamCache StreamCache) error
	FindByStreamID(streamID int64) ([]StreamCache, error)
	DeleteByStreamID(streamID int64) error
}

type streamCacheRepository struct {
	db *gorm.DB
}

func NewStreamCacheRepository(db *gorm.DB) StreamCacheRepository {
	return &streamCacheRepository{db: db}
}

func (r *streamCacheRepository) Create(streamCache StreamCache) error {
	streamCache.CreatedAt = time.Now()
	return r.db.Create(&streamCache).Error
}

func (r *streamCacheRepository) FindByStreamID(streamID int64) ([]StreamCache, error) {
	var streamCaches []StreamCache
	err := r.db.Preload("Cache").Where("stream_id = ?", streamID).Find(&streamCaches).Error
	return streamCaches, err
}

func (r *streamCacheRepository) DeleteByStreamID(streamID int64) error {
	return r.db.Where("stream_id = ?", streamID).Delete(&StreamCache{}).Error
}
