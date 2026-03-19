package coordinator

import (
	"encoding/json"
	"net/http"

	"github.com/rs/zerolog/log"

	coordinatorexecutor "github.com/sananguliyev/airtruct/internal/executor/coordinator"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type validateFlowRequest struct {
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

type validateFlowResponse struct {
	Valid bool   `json:"valid"`
	Error string `json:"error,omitempty"`
}

func (c *CoordinatorAPI) ValidateFlowHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req validateFlowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validateFlowResponse{Valid: false, Error: "invalid request body: " + err.Error()})
		return
	}

	flow := persistence.Flow{
		InputComponent:  req.InputComponent,
		InputLabel:      req.InputLabel,
		InputConfig:     []byte(req.InputConfig),
		OutputComponent: req.OutputComponent,
		OutputLabel:     req.OutputLabel,
		OutputConfig:    []byte(req.OutputConfig),
		Processors:      make([]persistence.FlowProcessor, len(req.Processors)),
	}
	for i, p := range req.Processors {
		flow.Processors[i] = persistence.FlowProcessor{
			Label:     p.Label,
			Component: p.Component,
			Config:    []byte(p.Config),
		}
	}

	if err := coordinatorexecutor.ValidateFlow(flow); err != nil {
		log.Debug().Err(err).Msg("flow validation failed")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(validateFlowResponse{Valid: false, Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(validateFlowResponse{Valid: true})
}
