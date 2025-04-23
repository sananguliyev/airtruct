package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"
	_ "github.com/warpstreamlabs/bento/public/components/all"
	"github.com/warpstreamlabs/bento/public/service"
)

func main() {
	app := &cli.App{
		Name:    "run",
		Usage:   "Run the airtruct server",
		Suggest: true,
		Version: "v0.0.1",
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:    "coordinator",
				Aliases: []string{"c"},
				Usage:   "role of the node",
				EnvVars: []string{"COORDINATOR"},
			},
			&cli.BoolFlag{
				Name:    "debug",
				Aliases: []string{"d"},
				Usage:   "debug mode",
				EnvVars: []string{"DEBUG_MODE"},
			},
		},
		Action: func(ctx *cli.Context) error {
			cCtx, stop := signal.NotifyContext(ctx.Context, os.Interrupt, os.Kill)
			defer stop()
			setLogLevel(ctx.Bool("debug"))
			if ctx.Bool("coordinator") {
				log.Info().Msg("starting coordinator")
				coordinatorCLI := InitializeCoordinatorCommand()
				coordinatorCLI.Run(cCtx)
				return nil
			} else {
				log.Info().Msg("starting worker")
				workerCLI := InitializeWorkerCommand()
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

func runStream(input, processor, output string) error {
	var err error
	var tracingSummary *service.TracingSummary

	streamBuilder := service.NewStreamBuilder()
	// if err = streamBuilder.AddInputYAML(input); err != nil {
	// 	return fmt.Errorf("could not add input YAML: %w", err)
	// }
	// if err = streamBuilder.AddOutputYAML(output); err != nil {
	// 	return fmt.Errorf("could not add output YAML: %w", err)
	// }

	// // add processor if available
	// if processor != "" {
	// 	if err = streamBuilder.AddProcessorYAML(processor); err != nil {
	// 		return fmt.Errorf("could not add processor YAML: %w", err)
	// 	}
	// }

	if err = streamBuilder.SetFields("http.enabled", true); err != nil {
		return fmt.Errorf("could not set fields: %w", err)
	}

	stream, tracingSummary, err := streamBuilder.BuildTraced()
	if err != nil {
		return fmt.Errorf("building stream has failed: %w", err)
	}

	ticker := time.NewTicker(5 * time.Second)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				log.Info().Uint64("total_input", tracingSummary.TotalInput()).Msg("result of stream is ready")
				log.Info().Msgf("inputs: %+v", tracingSummary.InputEvents(true))
				log.Info().Msgf("processors: %+v", tracingSummary.ProcessorEvents(true))
				log.Info().Msgf("output: %+v", tracingSummary.OutputEvents(true))
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()

	if err = stream.Run(context.Background()); err != nil {
		return fmt.Errorf("running stream has failed: %w", err)
	}

	//log.Info().Uint64("total_input", t.TotalInput()).Msg("result of stream is ready")
	//log.Info().Msgf("inputs: %+v", t.InputEvents(true))
	//log.Info().Msgf("inputs 2: %+v", t.InputEvents(true))
	//log.Info().Msgf("outputs: %+v", t.OutputEvents(true))

	return nil
}
