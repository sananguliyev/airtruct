package coordinator

import (
	"sync"
)

type StreamWorkerMap interface {
	GetStreamWorker(streamID int64) (string, bool)
	GetStreamWorkerStream(streamID int64) (int64, bool)
	SetStreamWorker(streamID int64, workerID string, workerStreamID int64)
	RemoveStream(streamID int64)
}

type streamWorkerMap struct {
	mu                 sync.RWMutex
	streamWorker       map[int64]string
	streamWorkerStream map[int64]int64
}

func NewStreamWorkerMap() StreamWorkerMap {
	return &streamWorkerMap{
		streamWorker:       make(map[int64]string),
		streamWorkerStream: make(map[int64]int64),
	}
}

func (m *streamWorkerMap) GetStreamWorker(streamID int64) (string, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	workerID, exists := m.streamWorker[streamID]
	return workerID, exists
}

func (m *streamWorkerMap) GetStreamWorkerStream(streamID int64) (int64, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	workerStreamID, exists := m.streamWorkerStream[streamID]
	return workerStreamID, exists
}

func (m *streamWorkerMap) SetStreamWorker(streamID int64, workerID string, workerStreamID int64) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.streamWorker[streamID] = workerID
	m.streamWorkerStream[streamID] = workerStreamID
}

func (m *streamWorkerMap) RemoveStream(streamID int64) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.streamWorker, streamID)
	delete(m.streamWorkerStream, streamID)
}
