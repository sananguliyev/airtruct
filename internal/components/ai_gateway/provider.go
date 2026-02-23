package ai_gateway

import (
	"context"
	"fmt"
)

type Provider interface {
	Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error)
}

type ChatRequest struct {
	Model        string
	SystemPrompt string
	Prompt       string
	MaxTokens    int
	Temperature  float64
}

type ChatResponse struct {
	Content      string
	Model        string
	FinishReason string
	Usage        Usage
}

type Usage struct {
	InputTokens  int
	OutputTokens int
}

func NewProvider(name, apiKey, baseURL string) (Provider, error) {
	switch name {
	case "openai":
		return newOpenAIProvider(apiKey, baseURL), nil
	case "anthropic":
		return newAnthropicProvider(apiKey, baseURL), nil
	default:
		return nil, fmt.Errorf("unsupported AI provider: %s", name)
	}
}
