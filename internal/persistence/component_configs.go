package persistence

import (
	"encoding/json"
	"errors"
	"time"

	pb "github.com/sananguliyev/airtruct/internal/protogen"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
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

func (c *ComponentConfig) ToProto() (*pb.ComponentConfig, error) {
	var config *structpb.Struct
	if c.Config != nil {
		var configMap map[string]interface{}
		if err := json.Unmarshal(c.Config, &configMap); err != nil {
			return nil, err
		}
		config, _ = structpb.NewStruct(configMap)
	}

	return &pb.ComponentConfig{
		Id:        c.ID,
		ParentId:  c.ParentID,
		Name:      c.Name,
		Section:   string(c.Section),
		Component: c.Component,
		Config:    config,
		IsCurrent: c.IsCurrent,
		CreatedAt: timestamppb.New(c.CreatedAt),
	}, nil
}

func (c *ComponentConfig) FromProto(p *pb.ComponentConfig) error {
	var configJSON datatypes.JSON
	if p.Config != nil {
		configBytes, err := json.Marshal(p.Config.AsMap())
		if err != nil {
			return err
		}
		configJSON = configBytes
	}

	c.ID = p.Id
	c.ParentID = p.ParentId
	c.Name = p.Name
	c.Section = ComponentSection(p.Section)
	c.Component = p.Component
	c.Config = configJSON
	c.IsCurrent = p.IsCurrent
	c.CreatedAt = p.CreatedAt.AsTime()

	return nil
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
