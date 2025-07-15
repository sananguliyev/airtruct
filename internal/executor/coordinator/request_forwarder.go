package coordinator

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"

	"github.com/sananguliyev/airtruct/internal/persistence"
	pb "github.com/sananguliyev/airtruct/internal/protogen"
)

type RequestForwarder interface {
	ForwardRequestToWorker(ctx context.Context, r *http.Request) (int32, []byte, error)
}

type requestForwarder struct {
	workerManager   WorkerManager
	streamWorkerMap StreamWorkerMap
	pathRegex       *regexp.Regexp
}

func NewRequestForwarder(
	workerManager WorkerManager,
	streamWorkerMap StreamWorkerMap,
) RequestForwarder {
	return &requestForwarder{
		workerManager:   workerManager,
		streamWorkerMap: streamWorkerMap,
		pathRegex:       regexp.MustCompile(`^/ingest/(\d+)(/.*)?$`),
	}
}

func (f *requestForwarder) ForwardRequestToWorker(ctx context.Context, r *http.Request) (int32, []byte, error) {
	var err error
	var id int64
	var componentPath string

	matches := f.pathRegex.FindStringSubmatch(r.URL.Path)
	if matches == nil {
		return 0, nil, fmt.Errorf("invalid path format")
	}

	id, err = strconv.ParseInt(matches[1], 10, 64)
	if err != nil {
		return 0, nil, fmt.Errorf("invalid ID format")
	}

	if len(matches) > 2 && matches[2] != "" {
		componentPath = matches[2]
	}

	workerStreamID, ok := f.streamWorkerMap.GetStreamWorkerStream(id)
	if !ok {
		return 0, nil, fmt.Errorf("worker stream not found for stream ID %d", id)
	}

	workerID, ok := f.streamWorkerMap.GetStreamWorker(id)
	if !ok {
		return 0, nil, fmt.Errorf("worker not found for stream ID %d", id)
	}

	workerClient, err := f.workerManager.GetWorkerClient(&persistence.Worker{ID: workerID})
	if err != nil {
		return 0, nil, fmt.Errorf("failed to get worker client: %w", err)
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		return 0, nil, fmt.Errorf("failed to read request body: %w", err)
	}
	defer r.Body.Close()

	resp, err := workerClient.Ingest(ctx, &pb.IngestRequest{
		WorkerStreamId: workerStreamID,
		Method:         r.Method,
		Path:           componentPath,
		ContentType:    r.Header.Get("Content-Type"),
		Payload:        bodyBytes,
	})

	if err != nil {
		return 0, nil, fmt.Errorf("failed to forward request to worker: %w", err)
	}

	return resp.StatusCode, resp.Response, nil
}
