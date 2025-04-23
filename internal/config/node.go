package config

import (
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog/log"
)

type NodeConfig struct {
	Coordinator  bool   `default:"true"`
	DiscoveryUri string `required:"true" envconfig:"NODE_DISCOVERY_URI"`
	Port         int    `required:"true" default:"8080"`
	GRPCPort     int32  `required:"true" envconfig:"NODE_GRPC_PORT" default:"50000"`
}

func NewNodeConfig() *NodeConfig {
	var c NodeConfig
	err := envconfig.Process("node", &c)
	if err != nil {
		log.Fatal().Err(err).Msg("Processing node config has failed")
	}

	return &c
}
