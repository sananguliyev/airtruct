package mysql_replication

import (
	"fmt"
	"sync"
	"time"

	"github.com/go-mysql-org/go-mysql/replication"
)

type eventProcessor struct {
	serverID      uint32
	includeTables []string
	excludeTables []string
	pendingGTID   string
	gtidMutex     sync.Mutex
	schemaCache   *schemaCache
	// File position tracking
	currentFile string
	currentPos  uint32
	fileMutex   sync.Mutex
}

func newEventProcessor(serverID uint32, includeTables, excludeTables []string, schemaCache *schemaCache) *eventProcessor {
	return &eventProcessor{
		serverID:      serverID,
		includeTables: includeTables,
		excludeTables: excludeTables,
		schemaCache:   schemaCache,
	}
}

func (ep *eventProcessor) shouldIncludeTable(database, table string) bool {
	fullTableName := fmt.Sprintf("%s.%s", database, table)

	for _, excludeTable := range ep.excludeTables {
		if excludeTable == fullTableName {
			return false
		}
	}

	if len(ep.includeTables) > 0 {
		for _, includeTable := range ep.includeTables {
			if includeTable == fullTableName {
				return true
			}
		}
		return false
	}

	return true
}

func (ep *eventProcessor) processEvent(ev *replication.BinlogEvent) []binlogEvent {
	var events []binlogEvent

	// Track file position for all events
	ep.fileMutex.Lock()
	ep.currentPos = ev.Header.LogPos
	ep.fileMutex.Unlock()

	// Handle rotate events (file changes)
	if rotateEv, ok := ev.Event.(*replication.RotateEvent); ok {
		ep.fileMutex.Lock()
		ep.currentFile = string(rotateEv.NextLogName)
		ep.currentPos = uint32(rotateEv.Position)
		ep.fileMutex.Unlock()
		return events
	}

	if gtidEv, ok := ev.Event.(*replication.GTIDEvent); ok {
		sidStr := fmt.Sprintf("%x-%x-%x-%x-%x",
			gtidEv.SID[0:4], gtidEv.SID[4:6], gtidEv.SID[6:8], gtidEv.SID[8:10], gtidEv.SID[10:16])
		gtid := fmt.Sprintf("%s:%d", sidStr, gtidEv.GNO)
		ep.gtidMutex.Lock()
		ep.pendingGTID = gtid
		ep.gtidMutex.Unlock()
		return events
	}

	switch e := ev.Event.(type) {
	case *replication.RowsEvent:
		if !ep.shouldIncludeTable(string(e.Table.Schema), string(e.Table.Table)) {
			return events
		}

		event := binlogEvent{
			Database: string(e.Table.Schema),
			Table:    string(e.Table.Table),
			Ts:       time.Now().Unix(),
			ServerID: fmt.Sprintf("server_%d", ep.serverID),
		}

		ep.gtidMutex.Lock()
		event.GTID = ep.pendingGTID
		ep.gtidMutex.Unlock()

		switch ev.Header.EventType {
		case replication.WRITE_ROWS_EVENTv1, replication.WRITE_ROWS_EVENTv2:
			event.Type = "insert"
			for _, row := range e.Rows {
				event.Data = ep.rowToMap(e.Table, row)
				events = append(events, event)
			}
		case replication.UPDATE_ROWS_EVENTv1, replication.UPDATE_ROWS_EVENTv2:
			event.Type = "update"
			for i := 0; i < len(e.Rows); i += 2 {
				if i+1 < len(e.Rows) {
					event.Old = ep.rowToMap(e.Table, e.Rows[i])
					event.Data = ep.rowToMap(e.Table, e.Rows[i+1])
					events = append(events, event)
				}
			}
		case replication.DELETE_ROWS_EVENTv1, replication.DELETE_ROWS_EVENTv2:
			event.Type = "delete"
			for _, row := range e.Rows {
				event.Data = ep.rowToMap(e.Table, row)
				events = append(events, event)
			}
		}
	}

	return events
}

func (ep *eventProcessor) rowToMap(table *replication.TableMapEvent, row []any) map[string]any {
	result := make(map[string]any)

	// Try to get column names from schema cache first (if enabled)
	var columnNames []string
	if ep.schemaCache != nil {
		if names, err := ep.schemaCache.getColumnNames(string(table.Schema), string(table.Table)); err == nil {
			columnNames = names
		}
	}

	// Fallback to binlog metadata if no schema cache or cache failed
	if len(columnNames) == 0 && len(table.ColumnName) > 0 {
		for _, colName := range table.ColumnName {
			columnNames = append(columnNames, string(colName))
		}
	}

	// Map row values to column names
	for i, value := range row {
		if i < len(columnNames) && columnNames[i] != "" {
			result[columnNames[i]] = value
		} else {
			result[fmt.Sprintf("col_%d", i)] = value
		}
	}

	return result
}

func (ep *eventProcessor) getPendingGTID() string {
	ep.gtidMutex.Lock()
	defer ep.gtidMutex.Unlock()
	return ep.pendingGTID
}

func (ep *eventProcessor) getCurrentFilePosition() (string, uint32) {
	ep.fileMutex.Lock()
	defer ep.fileMutex.Unlock()
	return ep.currentFile, ep.currentPos
}
