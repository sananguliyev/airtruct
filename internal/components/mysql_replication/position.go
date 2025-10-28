package mysql_replication

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/warpstreamlabs/bento/public/service"
)

func saveGTIDPosition(posFile string, gtid string, logger *service.Logger) {
	gtidRange, err := buildGTIDRange(gtid)
	if err != nil {
		logger.Errorf("Error building GTID range: %v", err)
		gtidRange = gtid
	}

	savePosition(posFile, binlogPosition{
		GTIDSet: gtidRange,
		Mode:    "gtid",
	}, logger)
}

func saveFilePosition(posFile string, binlogFile string, binlogPos uint32, logger *service.Logger) {
	savePosition(posFile, binlogPosition{
		BinlogFile: binlogFile,
		BinlogPos:  binlogPos,
		Mode:       "file",
	}, logger)
}

func savePosition(posFile string, position binlogPosition, logger *service.Logger) {
	data, err := json.Marshal(position)
	if err != nil {
		logger.Errorf("Error marshaling position: %v", err)
		return
	}

	if dir := filepath.Dir(posFile); dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			logger.Errorf("Error creating position directory: %v", err)
			return
		}
	}

	if err := os.WriteFile(posFile, data, 0644); err != nil {
		logger.Errorf("Error saving position to %s: %v", posFile, err)
	} else {
		if position.Mode == "gtid" {
			logger.Debugf("Saved GTID position: %s", position.GTIDSet)
		} else {
			logger.Debugf("Saved file position: %s:%d", position.BinlogFile, position.BinlogPos)
		}
	}
}

func buildGTIDRange(gtid string) (string, error) {
	parts := strings.Split(gtid, ":")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid GTID format: %s", gtid)
	}

	sid := parts[0]
	gno := parts[1]

	return fmt.Sprintf("%s:1-%s", sid, gno), nil
}

func loadPosition(posFile string) (binlogPosition, error) {
	data, err := os.ReadFile(posFile)
	if err != nil {
		return binlogPosition{}, err
	}

	var pos binlogPosition
	if err := json.Unmarshal(data, &pos); err != nil {
		return binlogPosition{}, err
	}

	return pos, nil
}
