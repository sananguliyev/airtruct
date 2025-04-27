package main

import (
	"fmt"
	"os"
	"os/signal"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"
	"github.com/urfave/cli/v2/altsrc"
	_ "github.com/warpstreamlabs/bento/public/components/all"
)

const (
	RoleCoordinator = "coordinator"
	RoleWorker      = "worker"
)

func main() {
	app := &cli.App{
		Name:    "run",
		Usage:   "Run the airtruct server",
		Suggest: true,
		Version: "v0.0.1",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "config",
				Aliases: []string{"c"},
				Usage:   "Load configuration from `FILE`",
			},
			altsrc.NewStringFlag(&cli.StringFlag{
				Name:    "role",
				Aliases: []string{"r"},
				Usage:   "role of the node (coordinator or worker)",
				EnvVars: []string{"ROLE"},
				Value:   RoleCoordinator,
			}),
			altsrc.NewStringFlag(&cli.StringFlag{
				Name:    "discovery-uri",
				Aliases: []string{"du"},
				Usage:   "node discovery URI",
				EnvVars: []string{"DISCOVERY_URI"},
				Value:   "localhost:50000",
			}),
			altsrc.NewUintFlag(&cli.UintFlag{
				Name:    "http-port",
				Aliases: []string{"hp"},
				Usage:   "http port of the node",
				EnvVars: []string{"HTTP_PORT"},
				Value:   8080,
			}),
			altsrc.NewUintFlag(&cli.UintFlag{
				Name:     "grpc-port",
				Aliases:  []string{"gp"},
				Usage:    "grpc port of the node",
				EnvVars:  []string{"GRPC_PORT"},
				Required: true,
			}),
			altsrc.NewBoolFlag(&cli.BoolFlag{
				Name:    "debug",
				Aliases: []string{"d"},
				Usage:   "debug mode",
				EnvVars: []string{"DEBUG_MODE"},
				Value:   false,
			}),
		},
		Before: func(ctx *cli.Context) error {
			configFile := ctx.String("config")
			if configFile != "" {
				log.Info().Str("config-file", configFile).Msg("Attempting to load configuration from file")
				yamlSource, err := altsrc.NewYamlSourceFromFile(configFile)
				if err != nil {
					return fmt.Errorf("failed to load config file %s: %w", configFile, err)
				}
				err = altsrc.ApplyInputSourceValues(ctx, yamlSource, ctx.App.Flags)
				if err != nil {
					return fmt.Errorf("error applying config source values: %w", err)
				}
				log.Info().Msg("Successfully loaded configuration from file")
			}

			// Validate role after potentially loading from config or env vars
			role := ctx.String("role")
			if role != RoleCoordinator && role != RoleWorker {
				return fmt.Errorf("invalid role: %s. Must be '%s' or '%s'", role, RoleCoordinator, RoleWorker)
			}

			return nil
		},
		Action: func(ctx *cli.Context) error {
			cCtx, stop := signal.NotifyContext(ctx.Context, os.Interrupt, os.Kill)
			defer stop()
			setLogLevel(ctx.Bool("debug"))
			if ctx.String("role") == RoleCoordinator {
				log.Info().Msg("starting coordinator")
				coordinatorCLI := InitializeCoordinatorCommand(uint32(ctx.Uint("http-port")), uint32(ctx.Uint("grpc-port")))
				coordinatorCLI.Run(cCtx)
				return nil
			} else {
				log.Info().Msg("starting worker")
				workerCLI := InitializeWorkerCommand(ctx.String("discovery-uri"), uint32(ctx.Uint("grpc-port")))
				workerCLI.Run(cCtx)
				return nil
			}
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal().Err(err).Msg("unable to start airturct")
	}

	log.Info().Msg("shutting node down")
}

func setLogLevel(debug bool) {
	if debug {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}
}
