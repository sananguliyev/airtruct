package utils

import "github.com/sananguliyev/airtruct/internal/persistence"

type WorkerHeap []persistence.Worker

func (h WorkerHeap) Len() int           { return len(h) }
func (h WorkerHeap) Less(i, j int) bool { return h[i].RunningStreamCount < h[j].RunningStreamCount }
func (h WorkerHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *WorkerHeap) Push(x any) {
	*h = append(*h, x.(persistence.Worker))
}

func (h *WorkerHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[0 : n-1]
	return x
}
