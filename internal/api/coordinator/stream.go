package coordinator

import (
	"context"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gopkg.in/yaml.v3"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

func extractCacheResourceName(configYAML string) (string, error) {
	if configYAML == "" {
		return "", nil
	}

	var config map[string]any
	if err := yaml.Unmarshal([]byte(configYAML), &config); err != nil {
		return "", err
	}

	if cacheResource, ok := config["cache_resource"].(string); ok && cacheResource != "" {
		return cacheResource, nil
	}

	return "", nil
}

func extractRateLimitResourceName(configYAML string) (string, error) {
	if configYAML == "" {
		return "", nil
	}

	var config map[string]any
	if err := yaml.Unmarshal([]byte(configYAML), &config); err != nil {
		return "", err
	}

	if rateLimitResource, ok := config["rate_limit"].(string); ok && rateLimitResource != "" {
		return rateLimitResource, nil
	}

	return "", nil
}

func (c *CoordinatorAPI) CreateStream(_ context.Context, in *pb.Stream) (*pb.StreamResponse, error) {
	if err := in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	stream := &persistence.Stream{
		Processors: make([]persistence.StreamProcessor, len(in.Processors)),
	}
	stream.FromProto(in)

	for i, processor := range in.Processors {
		stream.Processors[i] = persistence.StreamProcessor{
			Label:     processor.GetLabel(),
			Component: processor.GetComponent(),
			Config:    []byte(processor.GetConfig()),
		}
	}
	if err := c.streamRepo.Create(stream); err != nil {
		log.Error().Err(err).Msg("Failed to create stream")
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Extract and store cache resources
	cacheNames := make(map[string]bool)

	// Check input config
	if cacheName, err := extractCacheResourceName(in.GetInputConfig()); err == nil && cacheName != "" {
		cacheNames[cacheName] = true
	}

	// Check output config
	if cacheName, err := extractCacheResourceName(in.GetOutputConfig()); err == nil && cacheName != "" {
		cacheNames[cacheName] = true
	}

	// Store cache references
	for cacheName := range cacheNames {
		cache, err := c.cacheRepo.FindByLabel(cacheName)
		if err != nil {
			log.Warn().Err(err).Str("cache_label", cacheName).Msg("Failed to find cache")
			continue
		}
		if cache == nil {
			log.Warn().Str("cache_label", cacheName).Msg("Cache not found")
			continue
		}

		streamCache := persistence.StreamCache{
			StreamID: stream.ID,
			CacheID:  cache.ID,
		}

		if err := c.streamCacheRepo.Create(streamCache); err != nil {
			log.Error().Err(err).Str("cache_label", cacheName).Msg("Failed to store stream cache")
		}
	}

	// Extract and store rate limit resources
	rateLimitNames := make(map[string]bool)

	// Check input config
	if rateLimitName, err := extractRateLimitResourceName(in.GetInputConfig()); err == nil && rateLimitName != "" {
		rateLimitNames[rateLimitName] = true
	}

	// Check output config
	if rateLimitName, err := extractRateLimitResourceName(in.GetOutputConfig()); err == nil && rateLimitName != "" {
		rateLimitNames[rateLimitName] = true
	}

	// Store rate limit references
	for rateLimitName := range rateLimitNames {
		rateLimit, err := c.rateLimitRepo.FindByLabel(rateLimitName)
		if err != nil {
			log.Warn().Err(err).Str("rate_limit_label", rateLimitName).Msg("Failed to find rate limit")
			continue
		}
		if rateLimit == nil {
			log.Warn().Str("rate_limit_label", rateLimitName).Msg("Rate limit not found")
			continue
		}

		streamRateLimit := persistence.StreamRateLimit{
			StreamID:    stream.ID,
			RateLimitID: rateLimit.ID,
		}

		if err := c.streamRateLimitRepo.Create(streamRateLimit); err != nil {
			log.Error().Err(err).Str("rate_limit_label", rateLimitName).Msg("Failed to store stream rate limit")
		}
	}

	return &pb.StreamResponse{
		Data: stream.ToProto(),
		Meta: &pb.CommonResponse{Message: "Stream has been created successfully"},
	}, nil
}

func (c *CoordinatorAPI) GetStream(_ context.Context, in *pb.GetStreamRequest) (*pb.StreamResponse, error) {
	if err := in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	stream, err := c.streamRepo.FindByID(in.GetId())
	if err != nil {
		log.Error().Err(err).Msg("Failed to find stream")
		return nil, status.Error(codes.Internal, err.Error())
	} else if stream == nil {
		return nil, status.Error(codes.NotFound, "Stream not found")
	}

	return &pb.StreamResponse{
		Data: stream.ToProto(),
		Meta: &pb.CommonResponse{Message: "OK"},
	}, nil
}

func (c *CoordinatorAPI) ListStreams(_ context.Context, in *pb.ListStreamsRequest) (*pb.ListStreamsResponse, error) {
	streamStatuses := []persistence.StreamStatus{
		persistence.StreamStatusActive,
		persistence.StreamStatusCompleted,
		persistence.StreamStatusFailed,
		persistence.StreamStatusPaused,
	}

	if in.GetStatus() != "all" {
		streamStatuses = []persistence.StreamStatus{persistence.StreamStatus(in.GetStatus())}
	}

	streams, err := c.streamRepo.ListAllByStatuses(streamStatuses...)
	if err != nil {
		log.Error().Err(err).Msg("Failed to list streams")
		return nil, status.Error(codes.Internal, err.Error())
	}

	result := &pb.ListStreamsResponse{
		Data: make([]*pb.Stream, len(streams)),
	}
	for i, stream := range streams {
		result.Data[i] = stream.ToProto()
	}

	return result, nil
}

func (c *CoordinatorAPI) UpdateStream(_ context.Context, in *pb.Stream) (*pb.StreamResponse, error) {
	if err := in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	if in.GetId() == 0 {
		log.Debug().Msg("Invalid request: ID is required")
		return nil, status.Error(codes.InvalidArgument, "ID is required")
	}

	stream, err := c.streamRepo.FindByID(in.GetId())
	if err != nil {
		log.Error().Err(err).Msg("Failed to find stream")
		return nil, status.Error(codes.Internal, err.Error())
	} else if stream == nil {
		return nil, status.Error(codes.NotFound, "Stream not found")
	}

	newStream := &persistence.Stream{
		Processors: make([]persistence.StreamProcessor, len(in.Processors)),
	}
	newStream.FromProto(in)

	for i, processor := range in.Processors {
		newStream.Processors[i] = persistence.StreamProcessor{
			Label:     processor.GetLabel(),
			Component: processor.GetComponent(),
			Config:    []byte(processor.GetConfig()),
		}
	}
	newStream.ParentID = stream.ParentID

	if err = c.streamRepo.Update(newStream); err != nil {
		log.Error().Err(err).Msg("Failed to update stream")
		return nil, status.Error(codes.Internal, err.Error())
	}

	if newStream.Status == persistence.StreamStatusPaused || newStream.Status == persistence.StreamStatusFailed {
		workerStreams, err := c.workerStreamRepo.ListAllByStreamID(stream.ID)
		if err != nil {
			log.Error().Err(err).Int64("stream_id", stream.ID).Msg("Failed to list worker streams for stopping")
		} else {
			for _, ws := range workerStreams {
				if ws.Status == persistence.WorkerStreamStatusRunning || ws.Status == persistence.WorkerStreamStatusWaiting {
					if err := c.workerStreamRepo.UpdateStatus(ws.ID, persistence.WorkerStreamStatusStopped); err != nil {
						log.Error().Err(err).Int64("worker_stream_id", ws.ID).Msg("Failed to stop worker stream")
					} else {
						log.Info().Int64("stream_id", stream.ID).Int64("worker_stream_id", ws.ID).Str("worker_id", ws.WorkerID).Msg("Stopped worker stream due to stream status change")
					}
				}
			}
		}
	}

	// Extract and store cache resources
	cacheNames := make(map[string]bool)

	// Check input config
	if cacheName, err := extractCacheResourceName(in.GetInputConfig()); err == nil && cacheName != "" {
		cacheNames[cacheName] = true
	}

	// Check output config
	if cacheName, err := extractCacheResourceName(in.GetOutputConfig()); err == nil && cacheName != "" {
		cacheNames[cacheName] = true
	}

	// Store cache references
	for cacheName := range cacheNames {
		cache, err := c.cacheRepo.FindByLabel(cacheName)
		if err != nil {
			log.Warn().Err(err).Str("cache_label", cacheName).Msg("Failed to find cache")
			continue
		}
		if cache == nil {
			log.Warn().Str("cache_label", cacheName).Msg("Cache not found")
			continue
		}

		streamCache := persistence.StreamCache{
			StreamID: newStream.ID,
			CacheID:  cache.ID,
		}

		if err := c.streamCacheRepo.Create(streamCache); err != nil {
			log.Error().Err(err).Str("cache_label", cacheName).Msg("Failed to store stream cache")
		}
	}

	// Delete existing rate limit associations
	if err := c.streamRateLimitRepo.DeleteByStreamID(newStream.ID); err != nil {
		log.Error().Err(err).Msg("Failed to delete existing stream rate limits")
	}

	// Extract and store rate limit resources
	rateLimitNames := make(map[string]bool)

	// Check input config
	if rateLimitName, err := extractRateLimitResourceName(in.GetInputConfig()); err == nil && rateLimitName != "" {
		rateLimitNames[rateLimitName] = true
	}

	// Check output config
	if rateLimitName, err := extractRateLimitResourceName(in.GetOutputConfig()); err == nil && rateLimitName != "" {
		rateLimitNames[rateLimitName] = true
	}

	// Store rate limit references
	for rateLimitName := range rateLimitNames {
		rateLimit, err := c.rateLimitRepo.FindByLabel(rateLimitName)
		if err != nil {
			log.Warn().Err(err).Str("rate_limit_label", rateLimitName).Msg("Failed to find rate limit")
			continue
		}
		if rateLimit == nil {
			log.Warn().Str("rate_limit_label", rateLimitName).Msg("Rate limit not found")
			continue
		}

		streamRateLimit := persistence.StreamRateLimit{
			StreamID:    newStream.ID,
			RateLimitID: rateLimit.ID,
		}

		if err := c.streamRateLimitRepo.Create(streamRateLimit); err != nil {
			log.Error().Err(err).Str("rate_limit_label", rateLimitName).Msg("Failed to store stream rate limit")
		}
	}

	return &pb.StreamResponse{
		Data: newStream.ToProto(),
		Meta: &pb.CommonResponse{Message: "Stream has been updated successfully"},
	}, nil
}
