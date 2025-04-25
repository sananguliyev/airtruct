package coordinator

import (
	"context"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (c *CoordinatorAPI) CreateComponentConfig(_ context.Context, in *pb.ComponentConfig) (*pb.ComponentConfigResponse, error) {
	var err error

	if err = in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	componentConfig := &persistence.ComponentConfig{}
	if err = componentConfig.FromProto(in); err != nil {
		log.Error().Err(err).Msg("failed to convert component config from proto")
		return nil, status.Error(codes.Internal, "Failed to convert component config from proto")
	}

	if err = c.componentConfigRepo.AddComponentConfig(componentConfig); err != nil {
		log.Error().Err(err).Msg("failed to add component config")
		return nil, status.Error(codes.Internal, "Failed to create component config")
	}

	protoComponentConfig, err := componentConfig.ToProto()
	if err != nil {
		log.Error().Err(err).Msg("Failed to convert component config to proto")
		return nil, status.Error(codes.Internal, "Failed to convert component config to proto")
	}

	return &pb.ComponentConfigResponse{
		Data: protoComponentConfig,
		Meta: &pb.CommonResponse{Message: "ComponentConfig has been created successfully"},
	}, nil
}

func (c *CoordinatorAPI) ListComponentConfigs(_ context.Context, _ *emptypb.Empty) (*pb.ListComponentConfigsResponse, error) {
	componentConfigs, err := c.componentConfigRepo.ListComponentConfigs()
	if err != nil {
		log.Error().Err(err).Msg("Failed to list component configs")
		return nil, status.Error(codes.Internal, "Failed to list component configs")
	}

	result := &pb.ListComponentConfigsResponse{
		Data: make([]*pb.ComponentConfig, len(componentConfigs)),
	}
	for i, componentConfig := range componentConfigs {
		protoComponentConfig, err := componentConfig.ToProto()
		if err != nil {
			log.Error().Err(err).Msg("Failed to convert component config to proto")
			return nil, status.Error(codes.Internal, "Failed to convert component config to proto")
		}
		result.Data[i] = protoComponentConfig
	}

	return result, nil
}

func (c *CoordinatorAPI) GetComponentConfig(_ context.Context, in *pb.GetComponentConfigRequest) (*pb.ComponentConfigResponse, error) {
	if err := in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	componentConfig, err := c.componentConfigRepo.FindByID(in.GetId())
	if err != nil {
		log.Error().Err(err).Msg("Failed to get component config")
		return nil, status.Error(codes.Internal, "Failed to get component config")
	} else if componentConfig == nil {
		return nil, status.Error(codes.NotFound, "Component config not found")
	}

	protoComponentConfig, err := componentConfig.ToProto()
	if err != nil {
		log.Error().Err(err).Msg("Failed to convert component config to proto")
		return nil, status.Error(codes.Internal, "Failed to convert component config to proto")
	}

	return &pb.ComponentConfigResponse{
		Data: protoComponentConfig,
		Meta: &pb.CommonResponse{Message: "OK"},
	}, nil
}

func (c *CoordinatorAPI) UpdateComponentConfig(_ context.Context, in *pb.ComponentConfig) (*pb.ComponentConfigResponse, error) {
	if err := in.Validate(); err != nil {
		log.Debug().Err(err).Msg("Invalid request")
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	if in.GetId() == 0 {
		log.Debug().Msg("Invalid request: ID is required")
		return nil, status.Error(codes.InvalidArgument, "ID is required")
	}

	existingComponentConfig, err := c.componentConfigRepo.FindByID(in.GetId())
	if err != nil {
		log.Error().Err(err).Int64("component_config_id", in.GetId()).Msg("Failed to get component config")
		return nil, status.Error(codes.Internal, "Failed to find component config")
	} else if existingComponentConfig == nil {
		return nil, status.Error(codes.NotFound, "Component config not found")
	}

	newComponent := &persistence.ComponentConfig{}
	if err = newComponent.FromProto(in); err != nil {
		log.Error().Err(err).Msg("Failed to convert component config from proto")
		return nil, status.Error(codes.Internal, "Failed to convert component config from proto")
	}

	if err = c.componentConfigRepo.Update(newComponent); err != nil {
		log.Error().Err(err).Msg("Failed to update component config")
		return nil, status.Error(codes.Internal, "Failed to update component config")
	}

	protoComponentConfig, err := newComponent.ToProto()
	if err != nil {
		log.Error().Err(err).Msg("Failed to convert component config to proto")
		return nil, status.Error(codes.Internal, "Failed to convert component config to proto")
	}

	return &pb.ComponentConfigResponse{
		Data: protoComponentConfig,
		Meta: &pb.CommonResponse{Message: "ComponentConfig has been updated successfully"},
	}, nil
}
