package mysql_replication

type binlogEvent struct {
	Database string         `json:"database"`
	Table    string         `json:"table"`
	Type     string         `json:"type"`
	Ts       int64          `json:"ts"`
	ServerID string         `json:"server_id"`
	Data     map[string]any `json:"data"`
	Old      map[string]any `json:"old,omitempty"`
	GTID     string         `json:"gtid,omitempty"`
}

type binlogPosition struct {
	GTIDSet    string `json:"gtid_set,omitempty"`
	BinlogFile string `json:"binlog_file,omitempty"`
	BinlogPos  uint32 `json:"binlog_pos,omitempty"`
	Mode       string `json:"mode"` // "gtid" or "file"
}
