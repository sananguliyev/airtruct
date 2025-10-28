package mysql_replication

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-mysql-org/go-mysql/mysql"
	"github.com/go-mysql-org/go-mysql/replication"
	"github.com/warpstreamlabs/bento/public/service"
)

func init() {
	err := service.RegisterInput(
		"mysql_replication", Config(),
		func(conf *service.ParsedConfig, mgr *service.Resources) (service.Input, error) {
			return NewFromConfig(conf, mgr)
		})
	if err != nil {
		panic(err)
	}
}

type Input struct {
	host           string
	port           int
	user           string
	password       string
	serverID       uint32
	posFile        string
	includeTables  []string
	excludeTables  []string
	useSchemaCache bool
	schemaCacheTTL time.Duration
	positionMode   string
	flavor         string

	syncer    *replication.BinlogSyncer
	streamer  *replication.BinlogStreamer
	closeChan chan struct{}
	closeOnce sync.Once
	connected bool
	connMutex sync.RWMutex

	eventProcessor *eventProcessor
	schemaCache    *schemaCache
	logger         *service.Logger
}

func NewFromConfig(conf *service.ParsedConfig, mgr *service.Resources) (*Input, error) {
	host, err := conf.FieldString(mbfHost)
	if err != nil {
		return nil, err
	}

	port, err := conf.FieldInt(mbfPort)
	if err != nil {
		return nil, err
	}

	user, err := conf.FieldString(mbfUser)
	if err != nil {
		return nil, err
	}

	password, err := conf.FieldString(mbfPassword)
	if err != nil {
		return nil, err
	}

	serverID, err := conf.FieldInt(mbfServerID)
	if err != nil {
		return nil, err
	}

	posFile, err := conf.FieldString(mbfPosition)
	if err != nil {
		return nil, err
	}

	var includeTables []string
	if conf.Contains(mbfIncludeTables) {
		includeTables, err = conf.FieldStringList(mbfIncludeTables)
		if err != nil {
			return nil, err
		}
	}

	var excludeTables []string
	if conf.Contains(mbfExcludeTables) {
		excludeTables, err = conf.FieldStringList(mbfExcludeTables)
		if err != nil {
			return nil, err
		}
	}

	useSchemaCache := false
	if conf.Contains(mbfUseSchemaCache) {
		useSchemaCache, err = conf.FieldBool(mbfUseSchemaCache)
		if err != nil {
			return nil, err
		}
	}

	schemaCacheTTLStr := "5m"
	if conf.Contains(mbfSchemaCacheTTL) {
		schemaCacheTTLStr, err = conf.FieldString(mbfSchemaCacheTTL)
		if err != nil {
			return nil, err
		}
	}

	schemaCacheTTL, err := time.ParseDuration(schemaCacheTTLStr)
	if err != nil {
		return nil, fmt.Errorf("invalid schema_cache_ttl duration: %w", err)
	}

	var schemaCache *schemaCache
	if useSchemaCache {
		schemaCache, err = newSchemaCache(host, port, user, password, schemaCacheTTL)
		if err != nil {
			return nil, fmt.Errorf("failed to create schema cache: %w", err)
		}
	}

	positionMode := "gtid"
	if conf.Contains(mbfPositionMode) {
		positionMode, err = conf.FieldString(mbfPositionMode)
		if err != nil {
			return nil, err
		}
	}

	flavor := "mysql"
	if conf.Contains(mbfFlavor) {
		flavor, err = conf.FieldString(mbfFlavor)
		if err != nil {
			return nil, err
		}
	}

	if positionMode != "gtid" && positionMode != "file" {
		return nil, fmt.Errorf("invalid position_mode: %s (must be 'gtid' or 'file')", positionMode)
	}

	if flavor != "mysql" && flavor != "mariadb" {
		return nil, fmt.Errorf("invalid flavor: %s (must be 'mysql' or 'mariadb')", flavor)
	}

	return &Input{
		host:           host,
		port:           port,
		user:           user,
		password:       password,
		serverID:       uint32(serverID),
		posFile:        posFile,
		includeTables:  includeTables,
		excludeTables:  excludeTables,
		useSchemaCache: useSchemaCache,
		schemaCacheTTL: schemaCacheTTL,
		positionMode:   positionMode,
		flavor:         flavor,
		closeChan:      make(chan struct{}),
		logger:         mgr.Logger(),
		schemaCache:    schemaCache,
		eventProcessor: newEventProcessor(uint32(serverID), includeTables, excludeTables, schemaCache),
	}, nil
}

func (m *Input) Connect(ctx context.Context) error {
	m.connMutex.Lock()
	defer m.connMutex.Unlock()

	if m.connected {
		return nil
	}

	cfg := replication.BinlogSyncerConfig{
		ServerID: m.serverID,
		Flavor:   m.flavor,
		Host:     m.host,
		Port:     uint16(m.port),
		User:     m.user,
		Password: m.password,
	}

	syncer := replication.NewBinlogSyncer(cfg)
	m.syncer = syncer

	var streamer *replication.BinlogStreamer
	var err error

	// Load existing position if available
	pos, loadErr := loadPosition(m.posFile)

	if m.positionMode == "gtid" {
		// GTID mode (default)
		if loadErr == nil && pos.GTIDSet != "" && pos.Mode == "gtid" {
			gtidSet, parseErr := mysql.ParseGTIDSet(m.flavor, pos.GTIDSet)
			if parseErr != nil {
				m.logger.Errorf("Failed to parse GTID set %s: %v", pos.GTIDSet, parseErr)
				return fmt.Errorf("failed to parse GTID set: %w", parseErr)
			}
			m.logger.Infof("Resuming from GTID set: %s", pos.GTIDSet)
			streamer, err = syncer.StartSyncGTID(gtidSet)
		} else {
			m.logger.Info("Starting from current binlog position (GTID mode)")
			position := mysql.Position{Name: "", Pos: 0}
			streamer, err = syncer.StartSync(position)
		}
	} else {
		var position mysql.Position

		if loadErr == nil && pos.BinlogFile != "" && pos.Mode == "file" {
			position = mysql.Position{Name: pos.BinlogFile, Pos: pos.BinlogPos}
			m.logger.Infof("Resuming from file position: %s:%d", pos.BinlogFile, pos.BinlogPos)
		} else {
			position = mysql.Position{Name: "", Pos: 0}
			m.logger.Info("Starting from current binlog position (file mode)")
		}

		streamer, err = syncer.StartSync(position)
	}

	if err != nil {
		syncer.Close()
		return fmt.Errorf("failed to start sync: %w", err)
	}

	m.streamer = streamer
	m.connected = true
	m.logger.Info("Connected to MySQL binlog")
	return nil
}

func (m *Input) Read(ctx context.Context) (*service.Message, service.AckFunc, error) {
	m.connMutex.RLock()
	connected := m.connected
	streamer := m.streamer
	m.connMutex.RUnlock()

	if !connected || streamer == nil {
		return nil, nil, service.ErrNotConnected
	}

	ev, err := streamer.GetEvent(ctx)
	if err != nil {
		if err == context.Canceled || err == context.DeadlineExceeded {
			return nil, nil, err
		}
		m.logger.Errorf("Error getting event: %v", err)
		return nil, nil, fmt.Errorf("failed to get event: %w", err)
	}

	events := m.eventProcessor.processEvent(ev)
	if len(events) == 0 {
		return m.Read(ctx)
	}

	event := events[0]
	msg := service.NewMessage(nil)
	msg.SetStructured(event)

	ackFunc := func(ctx context.Context, err error) error {
		if err != nil {
			return nil
		}

		if m.positionMode == "gtid" {
			gtid := m.eventProcessor.getPendingGTID()
			if gtid != "" {
				saveGTIDPosition(m.posFile, gtid, m.logger)
			}
		} else {
			file, pos := m.eventProcessor.getCurrentFilePosition()
			if file != "" && pos > 0 {
				saveFilePosition(m.posFile, file, pos, m.logger)
			}
		}
		return nil
	}

	return msg, ackFunc, nil
}

func (m *Input) Close(ctx context.Context) error {
	m.closeOnce.Do(func() {
		m.connMutex.Lock()
		defer m.connMutex.Unlock()

		close(m.closeChan)

		if m.syncer != nil {
			m.syncer.Close()
		}

		if m.schemaCache != nil {
			m.schemaCache.close()
		}

		m.connected = false
		m.logger.Info("MySQL binlog input closed")
	})
	return nil
}
