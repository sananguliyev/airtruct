package persistence

import (
	"errors"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ComponentSection string

const (
	ComponentSectionInput    ComponentSection = "input"
	ComponentSectionPipeline ComponentSection = "pipeline"
	ComponentSectionOutput   ComponentSection = "output"
)

func (ct ComponentSection) Validate() error {
	switch ct {
	case ComponentSectionInput, ComponentSectionPipeline, ComponentSectionOutput:
		return nil
	default:
		return errors.New("invalid component type")
	}
}

type ComponentConfig struct {
	ID        int64            `json:"id" gorm:"primaryKey"`
	ParentID  *int64           `json:"parent_id"`
	Name      string           `json:"name"`
	Section   ComponentSection `json:"section"`
	Component string           `json:"component"`
	Config    datatypes.JSON   `json:"config"`
	IsCurrent bool             `json:"is_current" gorm:"default:true"`
	CreatedAt time.Time        `json:"created_at"`

	ParentComponentConfig *ComponentConfig `json:"parent_component_config" gorm:"foreignKey:ParentID"`
}

type ComponentConfigRepository interface {
	AddComponentConfig(component *ComponentConfig) error
	FindByID(id int64) (*ComponentConfig, error)
	Update(component *ComponentConfig) error
	ListComponentConfigs() ([]*ComponentConfig, error)
}

type componentConfigRepository struct {
	db *gorm.DB
}

func NewComponentRepository(db *gorm.DB) ComponentConfigRepository {
	return &componentConfigRepository{db: db}
}

func (r *componentConfigRepository) AddComponentConfig(component *ComponentConfig) error {
	if err := component.Section.Validate(); err != nil {
		return err
	}

	component.CreatedAt = time.Now()
	return r.db.Create(&component).Error
}

func (r *componentConfigRepository) Update(component *ComponentConfig) error {
	var err error

	if err = component.Section.Validate(); err != nil {
		return err
	}
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
		Model(&ComponentConfig{}).
		Where("id = ?", component.ID).
		Update("is_current", false).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	var id = component.ID
	component.CreatedAt = time.Now()
	if component.ParentID == nil {
		component.ParentID = &id
	}
	component.ID = 0

	if err = tx.Create(component).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (r *componentConfigRepository) FindByID(id int64) (*ComponentConfig, error) {
	var componentConfig = &ComponentConfig{
		ID: id,
	}
	err := r.db.First(componentConfig).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	return componentConfig, nil
}

func (r *componentConfigRepository) ListComponentConfigs() ([]*ComponentConfig, error) {
	var components []*ComponentConfig
	err := r.db.Where("is_current = true").Order("created_at DESC").Find(&components).Error
	if err != nil {
		return nil, err
	}
	return components, nil
}
