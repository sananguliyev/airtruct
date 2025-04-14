package coordinator

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/julienschmidt/httprouter"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

func (c *coordinator) CreateComponent(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var err error

	var body struct {
		Name      string                       `json:"name"`
		Section   persistence.ComponentSection `json:"section"`
		Component string                       `json:"component"`
		Config    map[string]any               `json:"config"`
	}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	componentConfig, err := json.Marshal(body.Config)
	if err != nil {
		http.Error(w, "Invalid component config", http.StatusBadRequest)
		return
	}

	component := &persistence.ComponentConfig{
		Name:      body.Name,
		Section:   body.Section,
		Component: body.Component,
		Config:    componentConfig,
	}

	if err = c.componentConfigRepo.AddComponentConfig(component); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "ComponentConfig has been created successfully"})
}

func (c *coordinator) ListComponents(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	componentConfigs, err := c.componentConfigRepo.ListComponentConfigs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(componentConfigs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *coordinator) GetComponentConfig(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id, err := strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Invalid component config ID", http.StatusBadRequest)
		return
	}
	componentConfig, err := c.componentConfigRepo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else if componentConfig == nil {
		http.Error(w, "Component config not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(componentConfig); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *coordinator) UpdateComponentConfig(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var err error

	id, err := strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Invalid component config ID", http.StatusBadRequest)
		return
	}

	var body struct {
		Name      string                       `json:"name"`
		Section   persistence.ComponentSection `json:"section"`
		Component string                       `json:"component"`
		Config    map[string]any               `json:"config"`
	}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	config, err := json.Marshal(body.Config)
	if err != nil {
		http.Error(w, "Invalid component config", http.StatusBadRequest)
		return
	}

	existingComponentConfig, err := c.componentConfigRepo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else if existingComponentConfig == nil {
		http.Error(w, "Component config not found", http.StatusNotFound)
		return
	}

	newComponent := &persistence.ComponentConfig{
		ID:        id,
		ParentID:  existingComponentConfig.ParentID,
		Name:      body.Name,
		Section:   body.Section,
		Component: body.Component,
		Config:    config,
	}

	if err = c.componentConfigRepo.Update(newComponent); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "ComponentConfig has been updated successfully"})
}
