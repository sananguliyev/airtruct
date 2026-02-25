package coordinator

import (
	"fmt"
	"path/filepath"
	"slices"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/sananguliyev/airtruct/internal/persistence"
)

const (
	FileRefPrefix    = "airtruct://"
	WorkerFilesDir   = "/tmp/airtruct/files"
)

type BuildResult struct {
	Config string
	Files  []persistence.File
}

type ConfigBuilder interface {
	BuildStreamConfig(stream persistence.Stream) (*BuildResult, error)
}

type configBuilder struct {
	streamCacheRepo     persistence.StreamCacheRepository
	streamRateLimitRepo persistence.StreamRateLimitRepository
	fileRepo            persistence.FileRepository
}

func NewConfigBuilder(streamCacheRepo persistence.StreamCacheRepository, streamRateLimitRepo persistence.StreamRateLimitRepository, fileRepo persistence.FileRepository) ConfigBuilder {
	return &configBuilder{
		streamCacheRepo:     streamCacheRepo,
		streamRateLimitRepo: streamRateLimitRepo,
		fileRepo:            fileRepo,
	}
}

func (b *configBuilder) BuildStreamConfig(stream persistence.Stream) (*BuildResult, error) {
	configMap := make(map[string]any)

	cacheResources, err := b.buildCacheResourcesConfig(stream.ID)
	if err != nil {
		return nil, err
	}
	if len(cacheResources) > 0 {
		configMap["cache_resources"] = cacheResources
	}

	rateLimitResources, err := b.buildRateLimitResourcesConfig(stream.ID)
	if err != nil {
		return nil, err
	}
	if len(rateLimitResources) > 0 {
		configMap["rate_limit_resources"] = rateLimitResources
	}

	input, err := b.buildInputConfig(stream)
	if err != nil {
		return nil, err
	}
	configMap["input"] = input

	if len(stream.Processors) > 0 {
		pipeline, err := b.buildPipelineConfig(stream.Processors)
		if err != nil {
			return nil, err
		}
		configMap["pipeline"] = pipeline
	}

	output, err := b.buildOutputConfig(stream)
	if err != nil {
		return nil, err
	}
	configMap["output"] = output

	fileKeys := collectFileRefs(configMap)
	var files []persistence.File
	if len(fileKeys) > 0 {
		files, err = b.fileRepo.FindByKeys(fileKeys)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch referenced files: %w", err)
		}
		if len(files) != len(fileKeys) {
			found := make(map[string]bool)
			for _, f := range files {
				found[f.Key] = true
			}
			for _, key := range fileKeys {
				if !found[key] {
					return nil, fmt.Errorf("referenced file not found: %s", key)
				}
			}
		}
		resolveFileRefs(configMap)
	}

	configYAML, err := yaml.Marshal(configMap)
	if err != nil {
		return nil, err
	}

	return &BuildResult{
		Config: string(configYAML),
		Files:  files,
	}, nil
}

func collectFileRefs(v any) []string {
	var keys []string
	switch val := v.(type) {
	case map[string]any:
		for _, child := range val {
			keys = append(keys, collectFileRefs(child)...)
		}
	case []any:
		for _, child := range val {
			keys = append(keys, collectFileRefs(child)...)
		}
	case string:
		if strings.HasPrefix(val, FileRefPrefix) {
			key := strings.TrimPrefix(val, FileRefPrefix)
			keys = append(keys, key)
		}
	}
	return keys
}

func resolveFileRefs(v any) {
	switch val := v.(type) {
	case map[string]any:
		for k, child := range val {
			if s, ok := child.(string); ok && strings.HasPrefix(s, FileRefPrefix) {
				key := strings.TrimPrefix(s, FileRefPrefix)
				val[k] = "file://" + filepath.Join(WorkerFilesDir, key)
			} else {
				resolveFileRefs(child)
			}
		}
	case []any:
		for i, child := range val {
			if s, ok := child.(string); ok && strings.HasPrefix(s, FileRefPrefix) {
				key := strings.TrimPrefix(s, FileRefPrefix)
				val[i] = "file://" + filepath.Join(WorkerFilesDir, key)
			} else {
				resolveFileRefs(child)
			}
		}
	}
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

func (b *configBuilder) buildPipelineConfig(processors []persistence.StreamProcessor) (map[string]any, error) {
	processorList := make([]any, len(processors))

	for i, processor := range processors {
		processorConfig, err := b.buildProcessorConfig(processor)
		if err != nil {
			return nil, err
		}
		processorList[i] = processorConfig
	}

	return map[string]any{
		"processors": processorList,
	}, nil
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

		cacheConfig := make(map[string]any)
		if err := yaml.Unmarshal(streamCache.Cache.Config, &cacheConfig); err != nil {
			return nil, err
		}

		cacheResource[streamCache.Cache.Component] = cacheConfig
		cacheResources = append(cacheResources, cacheResource)
	}

	return cacheResources, nil
}

func (b *configBuilder) buildRateLimitResourcesConfig(streamID int64) ([]map[string]any, error) {
	streamRateLimits, err := b.streamRateLimitRepo.FindByStreamID(streamID)
	if err != nil {
		return nil, err
	}

	if len(streamRateLimits) == 0 {
		return nil, nil
	}

	rateLimitResources := make([]map[string]any, 0, len(streamRateLimits))
	for _, streamRateLimit := range streamRateLimits {
		rateLimitResource := make(map[string]any)
		rateLimitResource["label"] = streamRateLimit.RateLimit.Label

		rateLimitConfig := make(map[string]any)
		if err := yaml.Unmarshal(streamRateLimit.RateLimit.Config, &rateLimitConfig); err != nil {
			return nil, err
		}

		rateLimitResource[streamRateLimit.RateLimit.Component] = rateLimitConfig
		rateLimitResources = append(rateLimitResources, rateLimitResource)
	}

	return rateLimitResources, nil
}
