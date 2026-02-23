package ai_gateway

import (
	"context"
	"fmt"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/packages/param"
)

type openaiProvider struct {
	client openai.Client
}

func newOpenAIProvider(apiKey, baseURL string) *openaiProvider {
	opts := []option.RequestOption{
		option.WithAPIKey(apiKey),
	}
	if baseURL != "" {
		opts = append(opts, option.WithBaseURL(baseURL))
	}
	return &openaiProvider{
		client: openai.NewClient(opts...),
	}
}

func (o *openaiProvider) Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
	messages := make([]openai.ChatCompletionMessageParamUnion, 0, 2)
	if req.SystemPrompt != "" {
		messages = append(messages, openai.SystemMessage(req.SystemPrompt))
	}
	messages = append(messages, openai.UserMessage(req.Prompt))

	params := openai.ChatCompletionNewParams{
		Model:    req.Model,
		Messages: messages,
	}
	if req.MaxTokens > 0 {
		params.MaxCompletionTokens = param.NewOpt(int64(req.MaxTokens))
	}
	if req.Temperature >= 0 {
		params.Temperature = param.NewOpt(req.Temperature)
	}

	completion, err := o.client.Chat.Completions.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("OpenAI chat request failed: %w", err)
	}

	if len(completion.Choices) == 0 {
		return nil, fmt.Errorf("OpenAI returned no choices")
	}

	return &ChatResponse{
		Content:      completion.Choices[0].Message.Content,
		Model:        completion.Model,
		FinishReason: completion.Choices[0].FinishReason,
		Usage: Usage{
			InputTokens:  int(completion.Usage.PromptTokens),
			OutputTokens: int(completion.Usage.CompletionTokens),
		},
	}, nil
}
