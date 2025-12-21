package coordinator

import (
	"slices"

	"gopkg.in/yaml.v3"

	"github.com/sananguliyev/airtruct/internal/persistence"
)

type ConfigBuilder interface {
	BuildStreamConfig(stream persistence.Stream) (string, error)
}

type configBuilder struct {
	streamCacheRepo persistence.StreamCacheRepository
}

func NewConfigBuilder(streamCacheRepo persistence.StreamCacheRepository) ConfigBuilder {
	return &configBuilder{
		streamCacheRepo: streamCacheRepo,
	}
}

func (b *configBuilder) BuildStreamConfig(stream persistence.Stream) (string, error) {
	configMap := make(map[string]any)

	// Build cache_resources section if there are any
	cacheResources, err := b.buildCacheResourcesConfig(stream.ID)
	if err != nil {
		return "", err
	}
	if len(cacheResources) > 0 {
		configMap["cache_resources"] = cacheResources
	}

	input, err := b.buildInputConfig(stream)
	if err != nil {
		return "", err
	}
	configMap["input"] = input

	if len(stream.Processors) > 0 {
		pipeline, err := b.buildPipelineConfig(stream.Processors)
		if err != nil {
			return "", err
		}
		configMap["pipeline"] = pipeline
	}

	output, err := b.buildOutputConfig(stream)
	if err != nil {
		return "", err
	}
	configMap["output"] = output

	configYAML, err := yaml.Marshal(configMap)
	if err != nil {
		return "", err
	}

	return string(configYAML), nil
}

func (b *configBuilder) buildInputConfig(stream persistence.Stream) (map[string]any, error) {
	input := make(map[string]any)
	input[stream.InputComponent] = make(map[string]any)

	if err := yaml.Unmarshal(stream.InputConfig, input[stream.InputComponent]); err != nil {
		return nil, err
	}

	input["label"] = stream.InputLabel
	return input, nil
}

func (b *configBuilder) buildOutputConfig(stream persistence.Stream) (map[string]any, error) {
	output := make(map[string]any)
	output[stream.OutputComponent] = make(map[string]any)

	if err := yaml.Unmarshal(stream.OutputConfig, output[stream.OutputComponent]); err != nil {
		return nil, err
	}

	output["label"] = stream.OutputLabel
	return output, nil
}

func (b *configBuilder) buildPipelineConfig(processors []persistence.StreamProcessor) (map[string][]any, error) {
	pipeline := map[string][]any{
		"processors": make([]any, len(processors)),
	}

	for i, processor := range processors {
		processorConfig, err := b.buildProcessorConfig(processor)
		if err != nil {
			return nil, err
		}
		pipeline["processors"][i] = processorConfig
	}

	return pipeline, nil
}

func (b *configBuilder) buildProcessorConfig(processor persistence.StreamProcessor) (map[string]any, error) {
	processorConfig := make(map[string]any)

	switch processor.Component {
	case "mapping":
		processorConfig[processor.Component] = string(processor.Config)
	case "catch", "switch":
		var processorList []any
		if err := yaml.Unmarshal(processor.Config, &processorList); err != nil {
			return nil, err
		}
		processorConfig[processor.Component] = processorList
	default:
		processorConfig[processor.Component] = make(map[string]any)
		if err := yaml.Unmarshal(processor.Config, processorConfig[processor.Component]); err != nil {
			return nil, err
		}
	}

	processorConfig["label"] = processor.Label
	return processorConfig, nil
}

func (b *configBuilder) isSpecialProcessor(component string) bool {
	return slices.Contains([]string{"catch", "switch"}, component)
}

func (b *configBuilder) buildCacheResourcesConfig(streamID int64) ([]map[string]any, error) {
	streamCaches, err := b.streamCacheRepo.FindByStreamID(streamID)
	if err != nil {
		return nil, err
	}

	if len(streamCaches) == 0 {
		return nil, nil
	}

	cacheResources := make([]map[string]any, 0, len(streamCaches))
	for _, streamCache := range streamCaches {
		cacheResource := make(map[string]any)
		cacheResource["label"] = streamCache.Cache.Label

		// Parse the cache config
		cacheConfig := make(map[string]any)
		if err := yaml.Unmarshal(streamCache.Cache.Config, &cacheConfig); err != nil {
			return nil, err
		}

		cacheResource[streamCache.Cache.Component] = cacheConfig
		cacheResources = append(cacheResources, cacheResource)
	}

	return cacheResources, nil
}
