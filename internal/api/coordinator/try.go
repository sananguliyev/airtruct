package coordinator

import (
	"encoding/json"
	"net/http"

	"github.com/rs/zerolog/log"

	coordinatorexecutor "github.com/sananguliyev/airtruct/internal/executor/coordinator"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type tryStreamRequest struct {
	Processors []struct {
		Label     string `json:"label"`
		Component string `json:"component"`
		Config    string `json:"config"`
	} `json:"processors"`
	Messages []coordinatorexecutor.TryMessage `json:"messages"`
}

func (c *CoordinatorAPI) TryStreamHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req tryStreamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(coordinatorexecutor.TryResult{Error: "invalid request body: " + err.Error()})
		return
	}

	processors := make([]persistence.StreamProcessor, len(req.Processors))
	for i, p := range req.Processors {
		processors[i] = persistence.StreamProcessor{
			Label:     p.Label,
			Component: p.Component,
			Config:    []byte(p.Config),
		}
	}

	envVarLookupFn := func(key string) (string, bool) {
		secret, err := c.secretRepo.GetByKey(key)
		if err != nil {
			return "", false
		}
		decrypted, err := c.aesgcm.Decrypt(secret.EncryptedValue)
		if err != nil {
			return "", false
		}
		return decrypted, true
	}

	result := coordinatorexecutor.TryStream(r.Context(), processors, req.Messages, coordinatorexecutor.TryStreamOptions{
		EnvVarLookupFn: envVarLookupFn,
		FileRepo:       c.fileRepo,
	})
	if result.Error != "" {
		log.Debug().Str("error", result.Error).Msg("stream try failed")
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
