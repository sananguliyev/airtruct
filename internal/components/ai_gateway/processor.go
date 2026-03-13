package ai_gateway

import (
	"context"
	"fmt"

	"github.com/warpstreamlabs/bento/public/bloblang"
	"github.com/warpstreamlabs/bento/public/service"
)

func init() {
	err := service.RegisterProcessor(
		"ai_gateway", Config(),
		func(conf *service.ParsedConfig, mgr *service.Resources) (service.Processor, error) {
			return NewFromConfig(conf, mgr)
		})
	if err != nil {
		panic(err)
	}
}

type Processor struct {
	provider      Provider
	model         string
	promptStatic  string
	promptDynamic *service.InterpolatedString
	sysMsgStatic  string
	sysMsgDynamic *service.InterpolatedString
	argsMapping   *bloblang.Executor
	maxTokens     int
	temperature   float64
	resultMap     *bloblang.Executor
	logger        *service.Logger
}

func NewFromConfig(conf *service.ParsedConfig, mgr *service.Resources) (*Processor, error) {
	providerName, err := conf.FieldString(agfProvider)
	if err != nil {
		return nil, err
	}

	model, err := conf.FieldString(agfModel)
	if err != nil {
		return nil, err
	}

	apiKey, err := conf.FieldString(agfAPIKey)
	if err != nil {
		return nil, err
	}

	var baseURL string
	if conf.Contains(agfBaseURL) {
		baseURL, err = conf.FieldString(agfBaseURL)
		if err != nil {
			return nil, err
		}
	}

	unsafeDynamic, err := conf.FieldBool(agfUnsafeDynamicPrompt)
	if err != nil {
		return nil, err
	}

	p := &Processor{
		model:  model,
		logger: mgr.Logger(),
	}

	if unsafeDynamic {
		if p.promptDynamic, err = conf.FieldInterpolatedString(agfPrompt); err != nil {
			return nil, err
		}
	} else {
		if p.promptStatic, err = conf.FieldString(agfPrompt); err != nil {
			return nil, err
		}
	}

	if conf.Contains(agfSystemPrompt) {
		if unsafeDynamic {
			if p.sysMsgDynamic, err = conf.FieldInterpolatedString(agfSystemPrompt); err != nil {
				return nil, err
			}
		} else {
			if p.sysMsgStatic, err = conf.FieldString(agfSystemPrompt); err != nil {
				return nil, err
			}
		}
	}

	if conf.Contains(agfArgsMapping) {
		if p.argsMapping, err = conf.FieldBloblang(agfArgsMapping); err != nil {
			return nil, err
		}
	}

	p.maxTokens, err = conf.FieldInt(agfMaxTokens)
	if err != nil {
		return nil, err
	}

	p.temperature, err = conf.FieldFloat(agfTemperature)
	if err != nil {
		return nil, err
	}

	p.resultMap, err = conf.FieldBloblang(agfResultMap)
	if err != nil {
		return nil, err
	}

	p.provider, err = NewProvider(providerName, apiKey, baseURL)
	if err != nil {
		return nil, err
	}

	return p, nil
}

func (p *Processor) Process(ctx context.Context, msg *service.Message) (service.MessageBatch, error) {
	var promptStr string
	var err error
	if p.promptDynamic != nil {
		promptStr, err = p.promptDynamic.TryString(msg)
		if err != nil {
			return nil, fmt.Errorf("failed to interpolate prompt: %w", err)
		}
	} else {
		promptStr = p.promptStatic
	}

	var systemPromptStr string
	if p.sysMsgDynamic != nil {
		systemPromptStr, err = p.sysMsgDynamic.TryString(msg)
		if err != nil {
			return nil, fmt.Errorf("failed to interpolate system_prompt: %w", err)
		}
	} else {
		systemPromptStr = p.sysMsgStatic
	}

	if p.argsMapping != nil {
		batch := service.MessageBatch{msg}
		executor := batch.BloblangExecutor(p.argsMapping)

		resMsg, err := executor.Query(0)
		if err != nil {
			return nil, fmt.Errorf("failed to execute args_mapping: %w", err)
		}

		iargs, err := resMsg.AsStructured()
		if err != nil {
			return nil, fmt.Errorf("args_mapping result is not structured: %w", err)
		}

		args, ok := iargs.([]any)
		if !ok {
			return nil, fmt.Errorf("args_mapping must evaluate to an array, got %T", iargs)
		}

		promptStr = fmt.Sprintf(promptStr, args...)
	}

	chatReq := &ChatRequest{
		Model:        p.model,
		Prompt:       promptStr,
		SystemPrompt: systemPromptStr,
		MaxTokens:    p.maxTokens,
		Temperature:  p.temperature,
	}

	p.logger.Debugf("AI gateway request: model=%s, prompt_len=%d, system_prompt_len=%d, max_tokens=%d, temperature=%f",
		chatReq.Model, len(chatReq.Prompt), len(chatReq.SystemPrompt), chatReq.MaxTokens, chatReq.Temperature)
	p.logger.Tracef("AI gateway prompt: %s", chatReq.Prompt)
	p.logger.Tracef("AI gateway system_prompt: %s", chatReq.SystemPrompt)

	chatResp, err := p.provider.Chat(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("AI chat request failed: %w", err)
	}

	p.logger.Debugf("AI gateway response: model=%s, finish_reason=%s, content_len=%d, input_tokens=%d, output_tokens=%d",
		chatResp.Model, chatResp.FinishReason, len(chatResp.Content), chatResp.Usage.InputTokens, chatResp.Usage.OutputTokens)
	if chatResp.Content == "" {
		p.logger.Warnf("AI gateway returned empty content: finish_reason=%s, model=%s", chatResp.FinishReason, chatResp.Model)
	}
	p.logger.Tracef("AI gateway response content: %s", chatResp.Content)

	responseObj := map[string]any{
		"content":       chatResp.Content,
		"model":         chatResp.Model,
		"finish_reason": chatResp.FinishReason,
		"usage": map[string]any{
			"input_tokens":  chatResp.Usage.InputTokens,
			"output_tokens": chatResp.Usage.OutputTokens,
		},
	}

	result, err := p.resultMap.Query(responseObj)
	if err != nil {
		return nil, fmt.Errorf("failed to execute result_map: %w", err)
	}

	outMsg := msg.Copy()
	outMsg.SetStructured(result)

	return service.MessageBatch{outMsg}, nil
}

func (p *Processor) Close(ctx context.Context) error {
	return nil
}
