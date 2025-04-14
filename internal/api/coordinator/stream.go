package coordinator

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/rs/zerolog/log"

	"github.com/julienschmidt/httprouter"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

func (c *coordinator) CreateStream(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var err error

	var body struct {
		Name       string `json:"name"`
		InputID    int    `json:"input_id"`
		InputLabel string `json:"input_label"`
		Processors []struct {
			Label       string `json:"label"`
			ProcessorID int    `json:"processor_id"`
		} `json:"processors"`
		OutputID    int    `json:"output_id"`
		OutputLabel string `json:"output_label"`
	}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Error().Err(err).Msg("Failed to decode request body")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	stream := &persistence.Stream{
		Name:        body.Name,
		InputID:     body.InputID,
		InputLabel:  body.InputLabel,
		Processors:  make([]persistence.StreamProcessor, len(body.Processors)),
		OutputID:    body.OutputID,
		OutputLabel: body.OutputLabel,
		Status:      persistence.StreamStatusActive,
	}

	for i, processor := range body.Processors {
		stream.Processors[i] = persistence.StreamProcessor{
			Label:       processor.Label,
			ProcessorID: processor.ProcessorID,
		}
	}

	if err = c.streamRepo.Create(stream); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Stream has been created successfully"})
}

func (c *coordinator) GetStream(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id, err := strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Invalid stream ID", http.StatusBadRequest)
		return
	}
	stream, err := c.streamRepo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else if stream == nil {
		http.Error(w, "Stream not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stream); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *coordinator) ListStreams(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	streams, err := c.streamRepo.ListAllByStatuses(
		persistence.StreamStatusActive,
		persistence.StreamStatusFinished,
		persistence.StreamStatusFailed,
		persistence.StreamStatusPaused,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(streams); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *coordinator) UpdateStream(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var err error

	id, err := strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Invalid stream ID", http.StatusBadRequest)
		return
	}

	var body struct {
		Name       string `json:"name"`
		InputID    int    `json:"input_id"`
		InputLabel string `json:"input_label"`
		Processors []struct {
			Label       string `json:"label"`
			ProcessorID int    `json:"processor_id"`
		} `json:"processors"`
		OutputID    int    `json:"output_id"`
		OutputLabel string `json:"output_label"`
		Status      string `json:"status"`
	}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	stream, err := c.streamRepo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else if stream == nil {
		http.Error(w, "Stream not found", http.StatusNotFound)
		return
	}

	newStream := &persistence.Stream{
		ID:          id,
		ParentID:    stream.ParentID,
		Name:        body.Name,
		InputID:     body.InputID,
		InputLabel:  body.InputLabel,
		Processors:  make([]persistence.StreamProcessor, len(body.Processors)),
		OutputID:    body.OutputID,
		OutputLabel: body.OutputLabel,
		Status:      persistence.StreamStatus(body.Status),
	}

	for i, processor := range body.Processors {
		newStream.Processors[i] = persistence.StreamProcessor{
			Label:       processor.Label,
			ProcessorID: processor.ProcessorID,
		}
	}

	if err = c.streamRepo.Update(newStream); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Stream has been updated successfully"})
}
