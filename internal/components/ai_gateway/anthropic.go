package ai_gateway

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/anthropics/anthropic-sdk-go/packages/param"
)

type anthropicProvider struct {
	client anthropic.Client
}

func newAnthropicProvider(apiKey, baseURL string) *anthropicProvider {
	opts := []option.RequestOption{
		option.WithAPIKey(apiKey),
	}
	if baseURL != "" {
		opts = append(opts, option.WithBaseURL(baseURL))
	}
	return &anthropicProvider{
		client: anthropic.NewClient(opts...),
	}
}

func (a *anthropicProvider) Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
	params := anthropic.MessageNewParams{
		Model:    anthropic.Model(req.Model),
		Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(req.Prompt))},
		MaxTokens: int64(req.MaxTokens),
	}
	if params.MaxTokens <= 0 {
		params.MaxTokens = 1024
	}
	if req.SystemPrompt != "" {
		params.System = []anthropic.TextBlockParam{{Text: req.SystemPrompt}}
	}
	if req.Temperature >= 0 {
		params.Temperature = param.NewOpt(req.Temperature)
	}

	message, err := a.client.Messages.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("Anthropic chat request failed: %w", err)
	}

	var content string
	for _, block := range message.Content {
		if block.Type == "text" {
			content = block.Text
			break
		}
	}

	return &ChatResponse{
		Content:      content,
		Model:        string(message.Model),
		FinishReason: string(message.StopReason),
		Usage: Usage{
			InputTokens:  int(message.Usage.InputTokens),
			OutputTokens: int(message.Usage.OutputTokens),
		},
	}, nil
}
