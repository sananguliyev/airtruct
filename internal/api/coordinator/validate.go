package coordinator

import (
	"encoding/json"
	"net/http"

	"github.com/rs/zerolog/log"

	coordinatorexecutor "github.com/sananguliyev/airtruct/internal/executor/coordinator"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type validateStreamRequest struct {
	InputComponent  string `json:"input_component"`
	InputLabel      string `json:"input_label"`
	InputConfig     string `json:"input_config"`
	OutputComponent string `json:"output_component"`
	OutputLabel     string `json:"output_label"`
	OutputConfig    string `json:"output_config"`
	Processors      []struct {
		Label     string `json:"label"`
		Component string `json:"component"`
		Config    string `json:"config"`
	} `json:"processors"`
}

type validateStreamResponse struct {
	Valid bool   `json:"valid"`
	Error string `json:"error,omitempty"`
}

func (c *CoordinatorAPI) ValidateStreamHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req validateStreamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validateStreamResponse{Valid: false, Error: "invalid request body: " + err.Error()})
		return
	}

	stream := persistence.Stream{
		InputComponent:  req.InputComponent,
		InputLabel:      req.InputLabel,
		InputConfig:     []byte(req.InputConfig),
		OutputComponent: req.OutputComponent,
		OutputLabel:     req.OutputLabel,
		OutputConfig:    []byte(req.OutputConfig),
		Processors:      make([]persistence.StreamProcessor, len(req.Processors)),
	}
	for i, p := range req.Processors {
		stream.Processors[i] = persistence.StreamProcessor{
			Label:     p.Label,
			Component: p.Component,
			Config:    []byte(p.Config),
		}
	}

	if err := coordinatorexecutor.ValidateStream(stream); err != nil {
		log.Debug().Err(err).Msg("stream validation failed")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(validateStreamResponse{Valid: false, Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(validateStreamResponse{Valid: true})
}
