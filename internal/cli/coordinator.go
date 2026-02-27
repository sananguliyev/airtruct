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
	"github.com/sananguliyev/airtruct/internal/auth"
	"github.com/sananguliyev/airtruct/internal/executor"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
	_ "github.com/sananguliyev/airtruct/internal/statik"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/rakyll/statik/fs"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
)

type MCPSyncer interface {
	SyncTools()
}

type CoordinatorCLI struct {
	api                *coordinator.CoordinatorAPI
	executor           executor.CoordinatorExecutor
	rateLimiterEngine  interface{ Cleanup(time.Duration) error }
	authManager        *auth.Manager
	mcpHandler         http.Handler
	mcpSyncer          MCPSyncer
	httpPort, grpcPort uint32
}

func NewCoordinatorCLI(api *coordinator.CoordinatorAPI, executor executor.CoordinatorExecutor, rateLimiterEngine interface{ Cleanup(time.Duration) error }, authManager *auth.Manager, mcpHandler interface {
	http.Handler
	MCPSyncer
}, httpPort, grpcPort uint32) *CoordinatorCLI {
	return &CoordinatorCLI{api, executor, rateLimiterEngine, authManager, mcpHandler, mcpHandler, httpPort, grpcPort}
}

func (c *CoordinatorCLI) Run(ctx context.Context) {
	g, ctx := errgroup.WithContext(ctx)

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Stopping worker health check / stream assignment routine...")
				return ctx.Err()
			case <-ticker.C:
				err := c.executor.CheckWorkersAndAssignStreams(ctx)
				if err != nil {
					log.Error().Err(err).Msg("Failed to perform worker health check and assign streams")
				}
			}
		}
	})

	leaseTicker := time.NewTicker(5 * time.Second)
	defer leaseTicker.Stop()

	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Stopping stream lease expiration checker routine...")
				return ctx.Err()
			case <-leaseTicker.C:
				err := c.executor.CheckStreamLeases(ctx)
				if err != nil {
					log.Error().Err(err).Msg("Failed to check stream leases")
				}
			}
		}
	})

	heartbeatTicker := time.NewTicker(10 * time.Second)
	defer heartbeatTicker.Stop()

	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Stopping worker heartbeat timeout checker routine...")
				return ctx.Err()
			case <-heartbeatTicker.C:
				err := c.executor.CheckWorkerHeartbeats(ctx)
				if err != nil {
					log.Error().Err(err).Msg("Failed to check worker heartbeats")
				}
			}
		}
	})

	cleanupTicker := time.NewTicker(1 * time.Hour)
	defer cleanupTicker.Stop()

	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Stopping rate limit state cleanup routine...")
				return ctx.Err()
			case <-cleanupTicker.C:
				err := c.rateLimiterEngine.Cleanup(24 * time.Hour)
				if err != nil {
					log.Error().Err(err).Msg("Failed to cleanup old rate limit states")
				} else {
					log.Debug().Msg("Rate limit state cleanup completed")
				}
			}
		}
	})

	mcpSyncTicker := time.NewTicker(5 * time.Second)
	defer mcpSyncTicker.Stop()

	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				log.Info().Msg("Stopping MCP tool sync routine...")
				return ctx.Err()
			case <-mcpSyncTicker.C:
				c.mcpSyncer.SyncTools()
			}
		}
	})

	coordinatorServerAddress := fmt.Sprintf(":%d", c.grpcPort)
	lis, err := net.Listen("tcp", coordinatorServerAddress)
	if err != nil {
		log.Fatal().Err(err).Uint32("port", c.grpcPort).Msg("failed to listen GRPC port")
	}

	grpcServer := grpc.NewServer()
	pb.RegisterCoordinatorServer(grpcServer, c.api)

	g.Go(func() error {
		log.Info().Uint32("port", c.grpcPort).Msg("starting coordinator GRPC server")
		errCh := make(chan error, 1)
		go func() {
			errCh <- grpcServer.Serve(lis)
		}()

		select {
		case err := <-errCh:
			log.Error().Err(err).Msg("gRPC server failed")
			return err
		case <-ctx.Done():
			log.Info().Msg("Shutting down gRPC server...")
			grpcServer.GracefulStop()
			log.Info().Msg("gRPC server stopped gracefully")
			return ctx.Err()
		}
	})

	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{MarshalOptions: protojson.MarshalOptions{
			EmitUnpopulated: true,
		}}),
	)
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	if err = pb.RegisterCoordinatorHandlerFromEndpoint(context.Background(), mux, coordinatorServerAddress, opts); err != nil {
		log.Fatal().Err(err).Msg("failed to register coordinator handler endpoint")
	}

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Accept-Encoding", "Authorization", "Content-Type", "Origin", "Mcp-Session-Id"},
		ExposedHeaders:   []string{"Content-Length", "Mcp-Session-Id"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60,
	})

	statikFS, err := fs.New()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create statik FS")
	}
	mainMux := http.NewServeMux()

	c.authManager.SetupAuthRoutes(mainMux)

	protectedAPI := c.authManager.Middleware(mux)
	mainMux.Handle("/api/", http.StripPrefix("/api", protectedAPI))
	mainMux.HandleFunc("/ingest/", func(w http.ResponseWriter, r *http.Request) {
		statusCode, response, err := c.executor.ForwardRequestToWorker(r.Context(), r)
		if err != nil {
			log.Error().Err(err).Msg("failed to ingest stream")
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(int(statusCode))
		w.Write(response)
	})
	mainMux.Handle("/mcp", c.mcpHandler)
	mainMux.Handle("/mcp/", c.mcpHandler)
	mainMux.HandleFunc("/", serveSpa(statikFS, "/index.html"))

	httpServer := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%d", c.httpPort),
		Handler: corsMiddleware.Handler(mainMux),
	}

	g.Go(func() error {
		log.Info().Uint32("port", c.httpPort).Msg("API gateway server starting")
		errCh := make(chan error, 1)
		go func() {
			errCh <- httpServer.ListenAndServe()
		}()

		select {
		case err := <-errCh:
			if err != nil && err != http.ErrServerClosed {
				log.Error().Err(err).Msg("HTTP gateway server failed")
				return err
			}
			log.Info().Msg("HTTP gateway server stopped.")
			return nil
		case <-ctx.Done():
			log.Info().Msg("Shutting down HTTP gateway server...")
			shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := httpServer.Shutdown(shutdownCtx); err != nil {
				log.Error().Err(err).Msg("HTTP gateway server graceful shutdown failed")
				return err
			}
			log.Info().Msg("HTTP gateway server stopped gracefully")
			return ctx.Err()
		}
	})

	log.Info().Msg("Coordinator running. Press Ctrl+C to stop.")
	if err := g.Wait(); err != nil && err != context.Canceled && err != context.DeadlineExceeded {
		log.Error().Err(err).Msg("Coordinator encountered an error")
	} else {
		log.Info().Msg("Coordinator shutdown complete.")
	}
}

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
