package persistence

import (
	"time"

	"gorm.io/gorm"
)

type Secret struct {
	Key            string    `gorm:"primaryKey" json:"key"`
	EncryptedValue string    `gorm:"not null" json:"encrypted_value"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type SecretRepository interface {
	List() ([]Secret, error)
	GetByKey(key string) (*Secret, error)
	Create(secret *Secret) error
	Delete(key string) error
}

type secretRepository struct {
	db *gorm.DB
}

func NewSecretRepository(db *gorm.DB) SecretRepository {
	return &secretRepository{db: db}
}

func (r *secretRepository) List() ([]Secret, error) {
	var secrets []Secret
	err := r.db.
		Order("created_at DESC").
		Find(&secrets).
		Error
	if err != nil {
		return nil, err
	}
	return secrets, nil
}

func (r *secretRepository) GetByKey(key string) (*Secret, error) {
	var secret Secret
	err := r.db.
		Where("key = ?", key).
		First(&secret).
		Error
	if err != nil {
		return nil, err
	}
	return &secret, nil
}

func (r *secretRepository) Create(secret *Secret) error {
	return r.db.Create(secret).Error
}

func (r *secretRepository) Delete(key string) error {
	return r.db.Delete(&Secret{}, "key = ?", key).Error
}
