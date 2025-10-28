package mysql_replication

import "github.com/warpstreamlabs/bento/public/service"

const (
	mbfHost           = "host"
	mbfPort           = "port"
	mbfUser           = "user"
	mbfPassword       = "password"
	mbfServerID       = "server_id"
	mbfPosition       = "position_file"
	mbfIncludeTables  = "include_tables"
	mbfExcludeTables  = "exclude_tables"
	mbfUseSchemaCache = "use_schema_cache"
	mbfSchemaCacheTTL = "schema_cache_ttl"
	mbfPositionMode   = "position_mode"
	mbfFlavor         = "flavor"
)

func Config() *service.ConfigSpec {
	return service.NewConfigSpec().
		Beta().
		Categories("Services").
		Summary("Consumes change events from a MySQL database binlog.").
		Description(`
This input connects to a MySQL database and monitors the binary log (binlog) for change events.
It outputs structured messages containing information about INSERT, UPDATE, and DELETE operations.

Each message contains:
- database: The name of the database
- table: The name of the table
- type: The operation type (insert, update, delete)
- ts: Unix timestamp when the event was processed
- server_id: Identifier for this input instance
- data: The row data (for all operations)
- old: The previous row data (for update operations only)

The input maintains position information to resume from the last processed event on restart.

Use include_tables and exclude_tables to filter which tables to monitor. 
Table names should be in the format: schema_name.table_name`).
		Field(service.NewStringField(mbfHost).
			Description("MySQL server hostname or IP address.").
			Default("localhost")).
		Field(service.NewIntField(mbfPort).
			Description("MySQL server port.").
			Default(3306)).
		Field(service.NewStringField(mbfUser).
			Description("MySQL username for connection.").
			Default("root")).
		Field(service.NewStringField(mbfPassword).
			Description("MySQL password for connection.").
			Secret()).
		Field(service.NewIntField(mbfServerID).
			Description("Unique server ID for this binlog consumer. Must be different from the MySQL server ID and other consumers.").
			Default(1000)).
		Field(service.NewStringField(mbfPosition).
			Description("File path to store/read position information for resuming. Will be created if it doesn't exist.").
			Default("./mysql_binlog.pos")).
		Field(service.NewStringField(mbfPositionMode).
			Description("Position tracking mode: 'gtid' (default) or 'file'.").
			Default("gtid")).
		Field(service.NewStringField(mbfFlavor).
			Description("Database flavor: 'mysql' (default) or 'mariadb'.").
			Default("mysql")).
		Field(service.NewStringListField(mbfIncludeTables).
			Description("List of tables to monitor in format 'schema_name.table_name'. If empty, all tables are monitored.").
			Optional()).
		Field(service.NewStringListField(mbfExcludeTables).
			Description("List of tables to exclude in format 'schema_name.table_name'.").
			Optional()).
		Field(service.NewBoolField(mbfUseSchemaCache).
			Description("Enable schema caching to get column names without requiring --binlog-row-metadata=FULL. This queries INFORMATION_SCHEMA to map column positions to names.").
			Default(false)).
		Field(service.NewStringField(mbfSchemaCacheTTL).
			Description("TTL for schema cache entries (e.g., '5m', '1h'). Schema is refreshed when cache expires.").
			Default("5m")).
		Version("1.0.0").
		Example("Basic MySQL binlog monitoring",
			`Monitor all changes using GTID position tracking`,
			`
input:
  mysql_binlog:
    host: localhost
    port: 3306
    user: replica_user
    password: replica_password
    server_id: 1001
    position_file: ./mysql_binlog.pos
`,
		).
		Example("MySQL binlog monitoring with file position",
			`Monitor changes using traditional binlog file and position`,
			`
input:
  mysql_binlog:
    host: localhost
    port: 3306
    user: replica_user
    password: replica_password
    server_id: 1001
    position_file: ./mysql_binlog.pos
    position_mode: file
`,
		).
		Example("Monitor specific tables",
			`Monitor only specific tables using include_tables`,
			`
input:
  mysql_binlog:
    host: mysql.example.com
    port: 3306
    user: replica_user
    password: replica_password
    server_id: 1001
    include_tables:
      - "ecommerce.orders"
      - "ecommerce.customers"
      - "analytics.events"
    exclude_tables:
      - "ecommerce.temp_table"
      - "analytics.debug_logs"
    position_file: ./mysql_binlog.pos
`,
		).
		Example("MariaDB binlog monitoring",
			`Monitor changes from a MariaDB database`,
			`
input:
  mysql_binlog:
    host: mariadb.example.com
    port: 3306
    user: replica_user
    password: replica_password
    server_id: 1001
    flavor: mariadb
    position_file: ./mariadb_binlog.pos
`,
		)
}
