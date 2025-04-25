package cli

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/sananguliyev/airtruct/internal/api/coordinator"
	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/executor"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
	_ "github.com/sananguliyev/airtruct/internal/statik"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/rakyll/statik/fs"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
)

// serveSpa serves a Single Page Application (SPA).
// If the requested file exists in the filesystem, it serves that file.
// Otherwise, it serves the specified index file (e.g., "index.html").
func serveSpa(fs http.FileSystem, indexFile string) http.HandlerFunc {
	fileServer := http.FileServer(fs)
	return func(w http.ResponseWriter, r *http.Request) {
		// Clean the path to prevent directory traversal issues
		reqPath := path.Clean(r.URL.Path)
		// StatikFS expects paths without a leading slash
		if reqPath == "/" || reqPath == "." {
			reqPath = indexFile // Serve index directly for root
		}

		// Check if the file exists in the embedded filesystem
		f, err := fs.Open(reqPath)
		if err != nil {
			if os.IsNotExist(err) {
				// File does not exist, serve index.html
				index, err := fs.Open(indexFile)
				if err != nil {
					log.Error().Err(err).Str("file", indexFile).Msg("Failed to open index file from statikFS")
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}
				defer index.Close()

				fi, err := index.Stat()
				if err != nil {
					log.Error().Err(err).Str("file", indexFile).Msg("Failed to stat index file from statikFS")
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}

				// Use ServeContent to handle content type, etag, etc.
				http.ServeContent(w, r, fi.Name(), fi.ModTime(), index)
				return
			} else {
				// Other error opening the file
				log.Error().Err(err).Str("path", reqPath).Msg("Error opening file from statikFS")
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
		}
		// File exists, close the handle used for checking
		f.Close()

		// Let the default file server handle serving the existing file
		fileServer.ServeHTTP(w, r)
	}
}

type CoordinatorCLI struct {
	api        *coordinator.CoordinatorAPI
	executor   executor.CoordinatorExecutor
	nodeConfig *config.NodeConfig
}

func NewCoordinatorCLI(api *coordinator.CoordinatorAPI, executor executor.CoordinatorExecutor, config *config.NodeConfig) *CoordinatorCLI {
	return &CoordinatorCLI{api, executor, config}
}

func (c *CoordinatorCLI) Run(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	go func(ctx context.Context) {
		for range ticker.C {
			err := c.executor.CheckWorkersAndAssignStreams(ctx)
			if err != nil {
				log.Error().Err(err).Msg("Failed to perform worker health check and assign streams")
			}
		}
	}(ctx)

	go func(ctx context.Context) {
		for range ticker.C {
			err := c.executor.CheckWorkerStreams(ctx)
			if err != nil {
				log.Error().Err(err).Msg("Failed to perform worker stream health check")
			}
		}
	}(ctx)

	log.Info().Int32("port", c.nodeConfig.GRPCPort).Msg("starting coordinator GRPC server")

	coordinatorServerAddress := fmt.Sprintf(":%d", c.nodeConfig.GRPCPort)
	lis, err := net.Listen("tcp", coordinatorServerAddress)
	if err != nil {
		log.Fatal().Err(err).Int32("port", c.nodeConfig.GRPCPort).Msg("failed to listen GRPC port")
	}

	grpcServer := grpc.NewServer()
	pb.RegisterCoordinatorServer(grpcServer, c.api)

	go func() {
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatal().Err(err).Msg("failed to serve GRPC")
		}
	}()

	// Register gRPC server endpoint
	// Note: Make sure the gRPC server is running properly and accessible
	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{MarshalOptions: protojson.MarshalOptions{
			EmitUnpopulated: true,
		}}),
	)
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	if err = pb.RegisterCoordinatorHandlerFromEndpoint(ctx, mux, coordinatorServerAddress, opts); err != nil {
		log.Fatal().Err(err).Msg("failed to register coordinator handler")
	}

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Accept-Encoding", "Authorization", "Content-Type", "Origin"},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // Maximum age for preflight cache (in seconds)
	})

	statikFS, err := fs.New()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create statik FS")
	}
	// Create a new ServeMux for routing
	mainMux := http.NewServeMux()

	// Register gRPC gateway mux under /api/
	// Use StripPrefix to remove /api before forwarding to the gateway mux
	mainMux.Handle("/api/", http.StripPrefix("/api", mux))

	// Register SPA handler for everything else
	mainMux.HandleFunc("/", serveSpa(statikFS, "/index.html"))

	// start listening to requests from the gateway server
	log.Info().Msgf("API gateway server listening on port %d", c.nodeConfig.Port)
	if err = http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", c.nodeConfig.Port), corsMiddleware.Handler(mainMux)); err != nil {
		log.Fatal().Err(err).Msg("failed to serve coordinator handler")
	}
}
