// Component schemas with nested configuration support
export const componentSchemas = {
  input: {
    generate: {
      title: "Generate",
      properties: {
        mapping: {
          type: "code",
          title: "Mapping",
          description: "A bloblang mapping to use for generating messages.",
          required: true,
        },
        interval: {
          type: "input",
          title: "Interval",
          description:
            "The time interval at which messages should be generated. E.g. 1s, 1m, 1h, @every 1s, 0,30 */2 * * * *",
          default: "1s",
        },
        count: {
          type: "number",
          title: "Count",
          description:
            "An optional number of messages to generate, if set above 0 the specified number of messages is generated and then the input will shut down.",
          default: 0,
        },
        batch_size: {
          type: "number",
          title: "Batch size",
          description:
            "The number of generated messages that should be accumulated into each batch flushed at the specified interval.",
          default: 1,
        },
        auto_replay_nacks: {
          type: "bool",
          title: "Auto replay",
          description:
            "Whether messages that are rejected (nacked) at the output level should be automatically replayed indefinitely",
          default: true,
        },
      },
    },
    http_client: {
      title: "HTTP Client",
      properties: {
        url: {
          type: "input",
          title: "URL",
          description: "The URL to connect to.",
          required: true,
        },
        verb: {
          type: "select",
          title: "HTTP Verb",
          description: "The HTTP verb to use.",
          options: ["GET", "POST", "PUT", "DELETE"],
          default: "GET",
        },
        headers: {
          type: "key_value",
          title: "Headers",
          description: "A map of headers to add to the request.",
          default: {},
        },
        metadata: {
          type: "object",
          title: "Metadata",
          description: "Metadata configuration",
          properties: {
            include_prefixes: {
              type: "array",
              title: "Include Prefixes",
              description: "Include metadata prefixes",
              default: [],
            },
            include_patterns: {
              type: "array",
              title: "Include Patterns",
              description: "Include metadata patterns",
              default: [],
            },
          },
        },
        dump_request_log_level: {
          type: "input",
          title: "Dump Request Log Level",
          description: "Log level to dump request details",
          default: "",
        },
        oauth: {
          type: "object",
          title: "OAuth",
          description: "OAuth configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable OAuth authentication",
              default: false,
            },
            consumer_key: {
              type: "input",
              title: "Consumer Key",
              description: "OAuth consumer key",
              default: "",
            },
            consumer_secret: {
              type: "input",
              title: "Consumer Secret",
              description: "OAuth consumer secret",
              default: "",
            },
            access_token: {
              type: "input",
              title: "Access Token",
              description: "OAuth access token",
              default: "",
            },
            access_token_secret: {
              type: "input",
              title: "Access Token Secret",
              description: "OAuth access token secret",
              default: "",
            },
          },
        },
        oauth2: {
          type: "object",
          title: "OAuth2",
          description: "OAuth2 configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable OAuth2 authentication",
              default: false,
            },
            client_key: {
              type: "input",
              title: "Client Key",
              description: "OAuth2 client key",
              default: "",
            },
            client_secret: {
              type: "input",
              title: "Client Secret",
              description: "OAuth2 client secret",
              default: "",
            },
            token_url: {
              type: "input",
              title: "Token URL",
              description: "OAuth2 token URL",
              default: "",
            },
            scopes: {
              type: "array",
              title: "Scopes",
              description: "OAuth2 scopes",
              default: [],
            },
            endpoint_params: {
              type: "key_value",
              title: "Endpoint Parameters",
              description: "OAuth2 endpoint parameters",
              default: {},
            },
          },
        },
        basic_auth: {
          type: "object",
          title: "Basic Auth",
          description: "Basic authentication configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable basic authentication",
              default: false,
            },
            username: {
              type: "input",
              title: "Username",
              description: "Basic auth username",
              default: "",
            },
            password: {
              type: "input",
              title: "Password",
              description: "Basic auth password",
              default: "",
            },
          },
        },
        jwt: {
          type: "object",
          title: "JWT",
          description: "JWT configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable JWT authentication",
              default: false,
            },
            private_key_file: {
              type: "input",
              title: "Private Key File",
              description: "JWT private key file",
              default: "",
            },
            signing_method: {
              type: "input",
              title: "Signing Method",
              description: "JWT signing method",
              default: "",
            },
            claims: {
              type: "key_value",
              title: "Claims",
              description: "JWT claims",
              default: {},
            },
            headers: {
              type: "key_value",
              title: "Headers",
              description: "JWT headers",
              default: {},
            },
          },
        },
        tls: {
          type: "object",
          title: "TLS",
          description: "TLS configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable TLS",
              default: false,
            },
            skip_cert_verify: {
              type: "bool",
              title: "Skip Certificate Verification",
              description: "Skip TLS certificate verification",
              default: false,
            },
            enable_renegotiation: {
              type: "bool",
              title: "Enable Renegotiation",
              description: "Enable TLS renegotiation",
              default: false,
            },
            root_cas: {
              type: "input",
              title: "Root CAs",
              description: "TLS root CAs",
              default: "",
            },
            root_cas_file: {
              type: "input",
              title: "Root CAs File",
              description: "TLS root CAs file",
              default: "",
            },
            client_certs: {
              type: "array",
              title: "Client Certificates",
              description: "TLS client certificates",
              default: [],
            },
          },
        },
        extract_headers: {
          type: "object",
          title: "Extract Headers",
          description: "Extract headers configuration",
          properties: {
            include_prefixes: {
              type: "array",
              title: "Include Prefixes",
              description: "Include header prefixes",
              default: [],
            },
            include_patterns: {
              type: "array",
              title: "Include Patterns",
              description: "Include header patterns",
              default: [],
            },
          },
        },
        rate_limit: {
          type: "input",
          title: "Rate Limit",
          description: "An optional rate limit to apply to the requests.",
          default: "",
        },
        timeout: {
          type: "input",
          title: "Timeout",
          description: "An optional timeout for the request.",
          default: "5s",
        },
        retry_period: {
          type: "input",
          title: "Retry Period",
          description: "Period to wait between retries",
          default: "1s",
        },
        max_retry_backoff: {
          type: "input",
          title: "Max Retry Backoff",
          description: "Maximum backoff time between retries",
          default: "300s",
        },
        retries: {
          type: "number",
          title: "Retries",
          description: "Number of retries",
          default: 3,
        },
        backoff_on: {
          type: "array",
          title: "Backoff On",
          description: "Status codes to backoff on",
          default: [429],
        },
        drop_on: {
          type: "array",
          title: "Drop On",
          description: "Status codes to drop on",
          default: [],
        },
        successful_on: {
          type: "array",
          title: "Successful On",
          description: "Status codes to consider successful",
          default: [],
        },
        proxy_url: {
          type: "input",
          title: "Proxy URL",
          description: "Proxy URL",
          default: "",
        },
      },
    },
    kafka: {
      title: "Kafka",
      properties: {
        addresses: {
          type: "array",
          title: "Addresses",
          description: "A list of broker addresses to connect to.",
          default: [],
        },
        topics: {
          type: "array",
          title: "Topics",
          description: "A list of topics to consume from.",
          default: [],
        },
        consumer_group: {
          type: "input",
          title: "Consumer Group",
          description: "A consumer group ID to use when consuming topics.",
        },
        client_id: {
          type: "input",
          title: "Client ID",
          description: "An identifier for the client connection.",
          default: "",
        },
        rack_id: {
          type: "input",
          title: "Rack ID",
          description: "A rack identifier for this client.",
          default: "",
        },
        start_from_oldest: {
          type: "bool",
          title: "Start From Oldest",
          description:
            "If true, the consumer group will begin at the oldest available offset.",
          default: false,
        },
        checkpoint_limit: {
          type: "number",
          title: "Checkpoint Limit",
          description:
            "The maximum number of messages to process before checkpointing the current offset.",
          default: 1000,
        },
        commit_period: {
          type: "input",
          title: "Commit Period",
          description: "The period of time between offset commits.",
          default: "1s",
        },
        max_processing_period: {
          type: "input",
          title: "Max Processing Period",
          description:
            "A maximum estimate for how long a message takes to be processed.",
          default: "100ms",
        },
        sasl: {
          type: "object",
          title: "SASL",
          description: "SASL authentication configuration.",
          properties: {
            mechanism: {
              type: "select",
              title: "Mechanism",
              description: "The SASL mechanism to use.",
              options: ["none", "PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"],
              default: "none",
            },
            user: {
              type: "input",
              title: "Username",
              description: "The SASL username.",
              default: "",
            },
            password: {
              type: "input",
              title: "Password",
              description: "The SASL password.",
              default: "",
            },
          },
        },
        target_version: {
          type: "input",
          title: "Target Version",
          description: "The version of the Kafka protocol to use.",
          default: "2.0.0",
        },
        batching: {
          type: "object",
          title: "Batching",
          description: "Allows you to configure a batching policy.",
          properties: {
            count: {
              type: "number",
              title: "Count",
              description:
                "A number of messages at which the batch should be flushed. If 0 disables count based batching.",
              default: 0,
            },
            byte_size: {
              type: "number",
              title: "Byte Size",
              description:
                "An amount of bytes at which the batch should be flushed. If 0 disables size based batching.",
              default: 0,
            },
            period: {
              type: "input",
              title: "Period",
              description:
                "A period in which an incomplete batch should be flushed regardless of its size.",
              default: "",
            },
            check: {
              type: "input",
              title: "Check",
              description:
                "A Bloblang query that should return a boolean value indicating whether a message should end a batch.",
              default: "",
            },
          },
        },
      },
    },
    http_server: {
      title: "HTTP Server",
      properties: {
        address: {
          type: "input",
          title: "Address",
          description:
            "An alternative address to host from. If left empty the service wide address is used",
          default: "",
        },
        path: {
          type: "input",
          title: "Path",
          description: "The endpoint path to listen for POST requests.",
          default: "/post",
        },
        allowed_verbs: {
          type: "array",
          title: "Allowed Verbs",
          description:
            "An array of verbs that are allowed for the path endpoint.",
          default: ["POST"],
        },
        timeout: {
          type: "input",
          title: "Timeout",
          description:
            "Timeout for requests. If a consumed messages takes longer than this to be delivered the connection is closed, but the message may still be delivered.",
          default: "5s",
        },
        sync_response: {
          type: "object",
          title: "Synchronous responses",
          description: "Customise messages returned via synchronous responses.",
          properties: {
            status: {
              type: "input",
              title: "HTTP Status code",
              description:
                "Specify the status code to return with synchronous responses",
              default: "200",
            },
            headers: {
              type: "key_value",
              title: "Headers",
              description: "A map of headers to add to the response.",
              default: {},
            },
          },
        },
      },
    },
    broker: {
      title: "Broker",
      description:
        "Allows you to combine multiple inputs into a single stream using a range of input brokers.",
      properties: {
        copies: {
          type: "number",
          title: "Copies",
          description:
            "The number of copies of each configured input to spawn.",
          default: 1,
        },
        inputs: {
          type: "input_list",
          title: "Inputs",
          description: "A list of child inputs to broker.",
          required: true,
          default: [],
        },
        batching: {
          type: "object",
          title: "Batching",
          description: "Allows you to configure a batching policy.",
          properties: {
            count: {
              type: "number",
              title: "Count",
              description:
                "A number of messages at which the batch should be flushed. If 0 disables count based batching.",
              default: 0,
            },
            byte_size: {
              type: "number",
              title: "Byte Size",
              description:
                "An amount of bytes at which the batch should be flushed. If 0 disables size based batching.",
              default: 0,
            },
            period: {
              type: "input",
              title: "Period",
              description:
                "A period in which an incomplete batch should be flushed regardless of its size.",
              default: "",
            },
            jitter: {
              type: "number",
              title: "Jitter",
              description:
                "A non-negative factor that adds random delay to batch flush intervals.",
              default: 0,
            },
            check: {
              type: "input",
              title: "Check",
              description:
                "A Bloblang query that should return a boolean value indicating whether a message should end a batch.",
              default: "",
            },
            processors: {
              type: "processor_list",
              title: "Processors",
              description:
                "A list of processors to apply to a batch as it is flushed.",
              default: [],
            },
          },
        },
      },
    },
    mysql_replication: {
      title: "MySQL (MariaDB) Replication (Experimental)",
      properties: {
        host: {
          type: "input",
          title: "Host",
          description: "MySQL server hostname or IP address.",
          required: true,
        },
        port: {
          type: "number",
          title: "Port",
          description: "MySQL server port.",
          default: 3306,
        },
        user: {
          type: "input",
          title: "User",
          description: "MySQL username for connection.",
          required: true,
        },
        password: {
          type: "input",
          title: "Password",
          description: "MySQL password for connection.",
          default: "",
          required: true,
        },
        server_id: {
          type: "number",
          title: "Server ID",
          description:
            "Unique server ID for this binlog consumer. Must be different from the MySQL server ID and other consumers.",
          default: 1000,
        },
        position_file: {
          type: "input",
          title: "Position File",
          description:
            "File path to store/read position information for resuming. Will be created if it doesn't exist.",
          default: "./mysql_binlog.pos",
        },
        include_tables: {
          type: "array",
          title: "Include Tables",
          description:
            "List of tables to monitor in format 'schema_name.table_name'. If empty, all tables are monitored.",
          default: [],
        },
        exclude_tables: {
          type: "array",
          title: "Exclude Tables",
          description:
            "List of tables to exclude in format 'schema_name.table_name'.",
          default: [],
        },
        use_schema_cache: {
          type: "bool",
          title: "Use Schema Cache",
          description:
            "Enable schema caching to get column names without requiring --binlog-row-metadata=FULL. This queries INFORMATION_SCHEMA to map column positions to names.",
          default: false,
        },
        schema_cache_ttl: {
          type: "input",
          title: "Schema Cache TTL",
          description:
            "TTL for schema cache entries (e.g., '5m', '1h'). Schema is refreshed when cache expires.",
          default: "5m",
        },
        position_mode: {
          type: "select",
          title: "Position Mode",
          description: "Position tracking mode: 'gtid' (default) or 'file'.",
          options: ["gtid", "file"],
          default: "gtid",
        },
        flavor: {
          type: "select",
          title: "Flavor",
          description: "Database flavor: 'mysql' (default) or 'mariadb'.",
          options: ["mysql", "mariadb"],
          default: "mysql",
        },
      },
    },
    shopify: {
      title: "Shopify",
      properties: {
        shop_name: {
          type: "input",
          title: "Shop Name",
          description: "Shopify store name (without .myshopify.com).",
          required: true,
        },
        api_key: {
          type: "input",
          title: "API Key",
          description: "Shopify API key for authentication (Private App).",
          required: true,
        },
        api_password: {
          type: "input",
          title: "API Password",
          description: "Shopify API password for authentication (Private App).",
          required: true,
        },
        shop_resource: {
          type: "select",
          title: "Shop Resource",
          description: "The Shopify resource type to fetch.",
          options: [
            "products",
            "orders",
            "customers",
            "inventory_items",
            "locations",
          ],
          default: "products",
        },
        limit: {
          type: "number",
          title: "Limit",
          description:
            "Maximum number of items to fetch per API request (max 250).",
          default: 50,
        },
        api_version: {
          type: "input",
          title: "API Version",
          description:
            "Shopify API version to use (e.g., '2024-01'). If not specified, uses the default version.",
          default: "",
        },
        cache_resource: {
          type: "dynamic_select",
          title: "Cache Resource",
          description:
            "Optional cache resource name for storing the last updated_at timestamp. When configured, resumes fetching from items updated after that timestamp.",
          dataSource: "caches",
          default: "",
        },
        rate_limit: {
          type: "dynamic_select",
          title: "Rate Limit",
          description:
            "Rate limit resource to use for Shopify API requests. Uses shop name as the rate limit key.",
          dataSource: "rate_limits",
          default: "",
        },
      },
    },
  },
  pipeline: {
    mapping: {
      title: "Mapping",
      flat: true,
      properties: {
        mapping: {
          type: "code",
          title: "Mapping",
          description: "A bloblang mapping to apply to messages.",
          required: true,
        },
      },
    },
    json_schema: {
      title: "JSON Schema",
      properties: {
        schema: {
          type: "code",
          title: "Schema",
          description: "A JSON schema to validate messages against.",
          required: true,
        },
      },
    },
    catch: {
      title: "Catch",
      description:
        "Applies a list of child processors only when a previous processing step has failed.",
      flat: true,
      properties: {
        processors: {
          type: "processor_list",
          title: "Processors",
          description:
            "A list of processors to apply when a message fails processing.",
          default: [],
        },
      },
    },
    switch: {
      title: "Switch",
      description: "Conditionally processes messages based on their contents.",
      flat: true,
      properties: {
        switch: {
          type: "processor_cases",
          title: "Cases",
          description:
            "A list of switch cases with conditions and processors to execute.",
          required: true,
          default: [],
        },
      },
    },
    schema_registry_decode: {
      title: "Schema Registry Decode",
      description:
        "Automatically decodes and validates messages with schemas from a Confluent Schema Registry service.",
      properties: {
        url: {
          type: "input",
          title: "URL",
          description: "The base URL of the schema registry service.",
          required: true,
        },
        avro_raw_json: {
          type: "bool",
          title: "Avro Raw JSON",
          description:
            "Whether Avro messages should be decoded into normal JSON rather than Avro JSON.",
          default: false,
        },
        avro_nested_schemas: {
          type: "bool",
          title: "Avro Nested Schemas",
          description:
            "Whether Avro Schemas are nested. If true bento will resolve schema references.",
          default: false,
        },
        oauth: {
          type: "object",
          title: "OAuth",
          description:
            "Allows you to specify open authentication via OAuth version 1.",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Whether to use OAuth version 1 in requests.",
              default: false,
            },
            consumer_key: {
              type: "input",
              title: "Consumer Key",
              description:
                "A value used to identify the client to the service provider.",
              default: "",
            },
            consumer_secret: {
              type: "input",
              title: "Consumer Secret",
              description:
                "A secret used to establish ownership of the consumer key.",
              default: "",
            },
            access_token: {
              type: "input",
              title: "Access Token",
              description:
                "A value used to gain access to the protected resources on behalf of the user.",
              default: "",
            },
            access_token_secret: {
              type: "input",
              title: "Access Token Secret",
              description:
                "A secret provided in order to establish ownership of a given access token.",
              default: "",
            },
          },
        },
        basic_auth: {
          type: "object",
          title: "Basic Auth",
          description: "Allows you to specify basic authentication.",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Whether to use basic authentication in requests.",
              default: false,
            },
            username: {
              type: "input",
              title: "Username",
              description: "A username to authenticate as.",
              default: "",
            },
            password: {
              type: "input",
              title: "Password",
              description: "A password to authenticate with.",
              default: "",
            },
          },
        },
        jwt: {
          type: "object",
          title: "JWT",
          description: "Allows you to specify JWT authentication.",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Whether to use JWT authentication in requests.",
              default: false,
            },
            private_key_file: {
              type: "input",
              title: "Private Key File",
              description:
                "A file with the PEM encoded via PKCS1 or PKCS8 as private key.",
              default: "",
            },
            signing_method: {
              type: "input",
              title: "Signing Method",
              description:
                "A method used to sign the token such as RS256, RS384, RS512 or EdDSA.",
              default: "",
            },
            claims: {
              type: "key_value",
              title: "Claims",
              description:
                "A value used to identify the claims that issued the JWT.",
              default: {},
            },
            headers: {
              type: "key_value",
              title: "Headers",
              description: "Add optional key/value headers to the JWT.",
              default: {},
            },
          },
        },
        tls: {
          type: "object",
          title: "TLS",
          description:
            "Custom TLS settings can be used to override system defaults.",
          properties: {
            skip_cert_verify: {
              type: "bool",
              title: "Skip Certificate Verification",
              description:
                "Whether to skip server side certificate verification.",
              default: false,
            },
            enable_renegotiation: {
              type: "bool",
              title: "Enable Renegotiation",
              description:
                "Whether to allow the remote server to repeatedly request renegotiation.",
              default: false,
            },
            root_cas: {
              type: "input",
              title: "Root CAs",
              description:
                "An optional root certificate authority to use. This is a string, representing a certificate chain from the parent trusted root certificate, to possible intermediate signing certificates, to the host certificate.",
              default: "",
            },
            root_cas_file: {
              type: "input",
              title: "Root CAs File",
              description:
                "An optional path of a root certificate authority file to use. This is a file, often with a .pem extension, containing a certificate chain from the parent trusted root certificate, to possible intermediate signing certificates, to the host certificate.",
              default: "",
            },
            client_certs: {
              type: "array",
              title: "Client Certificates",
              description:
                "A list of client certificates to use. For each certificate either the fields cert and key, or cert_file and key_file should be specified, but not both.",
              default: [],
            },
          },
        },
      },
    },
  },
  output: {
    http_client: {
      title: "HTTP Client",
      properties: {
        url: {
          type: "input",
          title: "URL",
          description: "The URL to send messages to.",
          required: true,
        },
        verb: {
          type: "select",
          title: "HTTP Verb",
          description: "The HTTP verb to use.",
          options: ["GET", "POST", "PUT", "DELETE"],
          default: "POST",
        },
        headers: {
          type: "key_value",
          title: "Headers",
          description: "A map of headers to add to the request.",
          default: {},
        },
        metadata: {
          type: "object",
          title: "Metadata",
          description: "Metadata configuration",
          properties: {
            include_prefixes: {
              type: "array",
              title: "Include Prefixes",
              description: "Include metadata prefixes",
              default: [],
            },
            include_patterns: {
              type: "array",
              title: "Include Patterns",
              description: "Include metadata patterns",
              default: [],
            },
          },
        },
        dump_request_log_level: {
          type: "input",
          title: "Dump Request Log Level",
          description: "Log level to dump request details",
          default: "",
        },
        oauth: {
          type: "object",
          title: "OAuth",
          description: "OAuth configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable OAuth authentication",
              default: false,
            },
            consumer_key: {
              type: "input",
              title: "Consumer Key",
              description: "OAuth consumer key",
              default: "",
            },
            consumer_secret: {
              type: "input",
              title: "Consumer Secret",
              description: "OAuth consumer secret",
              default: "",
            },
            access_token: {
              type: "input",
              title: "Access Token",
              description: "OAuth access token",
              default: "",
            },
            access_token_secret: {
              type: "input",
              title: "Access Token Secret",
              description: "OAuth access token secret",
              default: "",
            },
          },
        },
        oauth2: {
          type: "object",
          title: "OAuth2",
          description: "OAuth2 configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable OAuth2 authentication",
              default: false,
            },
            client_key: {
              type: "input",
              title: "Client Key",
              description: "OAuth2 client key",
              default: "",
            },
            client_secret: {
              type: "input",
              title: "Client Secret",
              description: "OAuth2 client secret",
              default: "",
            },
            token_url: {
              type: "input",
              title: "Token URL",
              description: "OAuth2 token URL",
              default: "",
            },
            scopes: {
              type: "array",
              title: "Scopes",
              description: "OAuth2 scopes",
              default: [],
            },
            endpoint_params: {
              type: "key_value",
              title: "Endpoint Parameters",
              description: "OAuth2 endpoint parameters",
              default: {},
            },
          },
        },
        basic_auth: {
          type: "object",
          title: "Basic Auth",
          description: "Basic authentication configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable basic authentication",
              default: false,
            },
            username: {
              type: "input",
              title: "Username",
              description: "Basic auth username",
              default: "",
            },
            password: {
              type: "input",
              title: "Password",
              description: "Basic auth password",
              default: "",
            },
          },
        },
        jwt: {
          type: "object",
          title: "JWT",
          description: "JWT configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable JWT authentication",
              default: false,
            },
            private_key_file: {
              type: "input",
              title: "Private Key File",
              description: "JWT private key file",
              default: "",
            },
            signing_method: {
              type: "input",
              title: "Signing Method",
              description: "JWT signing method",
              default: "",
            },
            claims: {
              type: "key_value",
              title: "Claims",
              description: "JWT claims",
              default: {},
            },
            headers: {
              type: "key_value",
              title: "Headers",
              description: "JWT headers",
              default: {},
            },
          },
        },
        tls: {
          type: "object",
          title: "TLS",
          description: "TLS configuration",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Enable TLS",
              default: false,
            },
            skip_cert_verify: {
              type: "bool",
              title: "Skip Certificate Verification",
              description: "Skip TLS certificate verification",
              default: false,
            },
            enable_renegotiation: {
              type: "bool",
              title: "Enable Renegotiation",
              description: "Enable TLS renegotiation",
              default: false,
            },
            root_cas: {
              type: "input",
              title: "Root CAs",
              description: "TLS root CAs",
              default: "",
            },
            root_cas_file: {
              type: "input",
              title: "Root CAs File",
              description: "TLS root CAs file",
              default: "",
            },
            client_certs: {
              type: "array",
              title: "Client Certificates",
              description: "TLS client certificates",
              default: [],
            },
          },
        },
        extract_headers: {
          type: "object",
          title: "Extract Headers",
          description: "Extract headers configuration",
          properties: {
            include_prefixes: {
              type: "array",
              title: "Include Prefixes",
              description: "Include header prefixes",
              default: [],
            },
            include_patterns: {
              type: "array",
              title: "Include Patterns",
              description: "Include header patterns",
              default: [],
            },
          },
        },
        rate_limit: {
          type: "input",
          title: "Rate Limit",
          description: "An optional rate limit to apply to the requests.",
          default: "",
        },
        timeout: {
          type: "input",
          title: "Timeout",
          description: "An optional timeout for the request.",
          default: "5s",
        },
        retry_period: {
          type: "input",
          title: "Retry Period",
          description: "Period to wait between retries",
          default: "1s",
        },
        max_retry_backoff: {
          type: "input",
          title: "Max Retry Backoff",
          description: "Maximum backoff time between retries",
          default: "300s",
        },
        retries: {
          type: "number",
          title: "Retries",
          description: "Number of retries",
          default: 3,
        },
        backoff_on: {
          type: "array",
          title: "Backoff On",
          description: "Status codes to backoff on",
          default: [429],
        },
        drop_on: {
          type: "array",
          title: "Drop On",
          description: "Status codes to drop on",
          default: [],
        },
        successful_on: {
          type: "array",
          title: "Successful On",
          description: "Status codes to consider successful",
          default: [],
        },
        proxy_url: {
          type: "input",
          title: "Proxy URL",
          description: "Proxy URL",
          default: "",
        },
        batch_as_multipart: {
          type: "bool",
          title: "Batch as Multipart",
          description: "Whether to send batched messages as multipart requests",
          default: false,
        },
        propagate_response: {
          type: "bool",
          title: "Propagate Response",
          description:
            "Whether to propagate the response from the HTTP request",
          default: false,
        },
        max_in_flight: {
          type: "number",
          title: "Max In Flight",
          description:
            "The maximum number of messages to have in flight at a given time",
          default: 64,
        },
        batching: {
          type: "object",
          title: "Batching",
          description: "Batching configuration",
          properties: {
            count: {
              type: "number",
              title: "Count",
              description: "The number of messages to batch together",
              default: 0,
            },
            byte_size: {
              type: "number",
              title: "Byte Size",
              description: "The size of messages to batch together",
              default: 0,
            },
            period: {
              type: "input",
              title: "Period",
              description: "The period of time to batch messages together",
              default: "",
            },
            check: {
              type: "input",
              title: "Check",
              description: "A condition to check before batching messages",
              default: "",
            },
            processors: {
              type: "array",
              title: "Processors",
              description: "A list of processors to apply to batched messages",
              default: [],
            },
          },
        },
        multipart: {
          type: "array",
          title: "Multipart",
          description: "A list of multipart form fields",
          default: [],
        },
      },
    },
    kafka: {
      title: "Kafka",
      properties: {
        addresses: {
          type: "array",
          title: "Addresses",
          description: "A list of broker addresses to connect to.",
          default: [],
        },
        topic: {
          type: "input",
          title: "Topic",
          description: "The topic to produce to.",
        },
        key: {
          type: "input",
          title: "Key",
          description:
            "An optional key to set for each message (interpolated).",
          default: "",
        },
        client_id: {
          type: "input",
          title: "Client ID",
          description: "An identifier for the client connection.",
          default: "",
        },
        max_in_flight: {
          type: "number",
          title: "Max In Flight",
          description:
            "The maximum number of messages to have in flight at a given time.",
          default: 1000,
        },
        ack_replicas: {
          type: "bool",
          title: "Ack Replicas",
          description:
            "Whether to wait for all replicas to acknowledge messages.",
          default: false,
        },
        compression: {
          type: "select",
          title: "Compression",
          description: "The compression algorithm to use.",
          options: ["none", "gzip", "snappy", "lz4", "zstd"],
          default: "none",
        },
        max_message_bytes: {
          type: "number",
          title: "Max Message Bytes",
          description: "The maximum permitted size of a message.",
          default: 1000000,
        },
        target_version: {
          type: "input",
          title: "Target Version",
          description: "The version of the Kafka protocol to use.",
          default: "2.0.0",
        },
        timeout: {
          type: "input",
          title: "Timeout",
          description:
            "The maximum amount of time to wait for an ack before retrying a send.",
          default: "5s",
        },
        metadata: {
          type: "object",
          title: "Metadata",
          description:
            "Specify criteria for which metadata values are added to messages as headers.",
          properties: {
            include_prefixes: {
              type: "array",
              title: "Include Prefixes",
              description: "Include metadata prefixes as message headers.",
              default: [],
            },
            include_patterns: {
              type: "array",
              title: "Include Patterns",
              description: "Include metadata patterns as message headers.",
              default: [],
            },
          },
        },
        tls: {
          type: "object",
          title: "TLS",
          description: "TLS configuration for secure connections.",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Whether to use TLS for secure connections.",
              default: false,
            },
            skip_cert_verify: {
              type: "bool",
              title: "Skip Certificate Verification",
              description:
                "Whether to skip verification of the server's certificate chain and host name.",
              default: false,
            },
            enable_renegotiation: {
              type: "bool",
              title: "Enable Renegotiation",
              description:
                "Whether to allow the remote server to change its certificates during client connection.",
              default: false,
            },
            root_cas: {
              type: "input",
              title: "Root CAs",
              description: "A list of paths to root certificate authorities.",
              default: "",
            },
            root_cas_file: {
              type: "input",
              title: "Root CAs File",
              description:
                "Path to a file containing root certificate authorities.",
              default: "",
            },
            client_certs: {
              type: "array",
              title: "Client Certificates",
              description: "A list of client certificates to use.",
              default: [],
            },
          },
        },
        sasl: {
          type: "object",
          title: "SASL",
          description: "SASL authentication configuration.",
          properties: {
            enabled: {
              type: "bool",
              title: "Enabled",
              description: "Whether to use SASL authentication.",
              default: false,
            },
            mechanism: {
              type: "select",
              title: "Mechanism",
              description: "The SASL mechanism to use.",
              options: ["none", "PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"],
              default: "none",
            },
            username: {
              type: "input",
              title: "Username",
              description: "The SASL username.",
              default: "",
            },
            password: {
              type: "input",
              title: "Password",
              description: "The SASL password.",
              default: "",
            },
          },
        },
        batching: {
          type: "object",
          title: "Batching",
          description: "Batching configuration for message production.",
          properties: {
            count: {
              type: "number",
              title: "Count",
              description: "The number of messages to batch together.",
              default: 0,
            },
            byte_size: {
              type: "number",
              title: "Byte Size",
              description: "The size of messages to batch together.",
              default: 0,
            },
            period: {
              type: "input",
              title: "Period",
              description: "The period of time to batch messages together.",
              default: "",
            },
            jitter: {
              type: "number",
              title: "Jitter",
              description: "The jitter to apply to the batching period.",
              default: 0,
            },
            check: {
              type: "input",
              title: "Check",
              description: "A condition to check before batching messages.",
              default: "",
            },
            processors: {
              type: "array",
              title: "Processors",
              description: "A list of processors to apply to batched messages.",
              default: [],
            },
          },
        },
      },
    },
    sync_response: {
      title: "Sync Response",
      properties: {},
    },
    switch: {
      title: "Switch",
      description:
        "Route messages to different outputs based on their contents.",
      properties: {
        retry_until_success: {
          type: "bool",
          title: "Retry Until Success",
          description:
            "If a selected output fails to send a message this field determines whether it is reattempted indefinitely.",
          default: false,
        },
        strict_mode: {
          type: "bool",
          title: "Strict Mode",
          description:
            "Whether an error should be reported if no condition is met. If set to true, an error is propagated back to the input level.",
          default: false,
        },
        cases: {
          type: "output_cases",
          title: "Cases",
          description:
            "A list of switch cases, outlining outputs that can be routed to.",
          required: true,
          default: [],
        },
      },
    },
    broker: {
      title: "Broker",
      description:
        "Route messages to multiple child outputs using a range of brokering patterns.",
      properties: {
        copies: {
          type: "number",
          title: "Copies",
          description:
            "The number of copies of each configured output to spawn.",
          default: 1,
        },
        pattern: {
          type: "select",
          title: "Pattern",
          description: "The brokering pattern to use.",
          options: [
            "fan_out",
            "fan_out_fail_fast",
            "fan_out_sequential",
            "fan_out_sequential_fail_fast",
            "round_robin",
            "greedy",
          ],
          default: "fan_out",
        },
        outputs: {
          type: "output_list",
          title: "Outputs",
          description: "A list of child outputs to broker.",
          required: true,
          default: [],
        },
        batching: {
          type: "object",
          title: "Batching",
          description: "Allows you to configure a batching policy.",
          properties: {
            count: {
              type: "number",
              title: "Count",
              description:
                "A number of messages at which the batch should be flushed. If 0 disables count based batching.",
              default: 0,
            },
            byte_size: {
              type: "number",
              title: "Byte Size",
              description:
                "An amount of bytes at which the batch should be flushed. If 0 disables size based batching.",
              default: 0,
            },
            period: {
              type: "input",
              title: "Period",
              description:
                "A period in which an incomplete batch should be flushed regardless of its size.",
              default: "",
            },
            jitter: {
              type: "number",
              title: "Jitter",
              description:
                "A non-negative factor that adds random delay to batch flush intervals.",
              default: 0,
            },
            check: {
              type: "input",
              title: "Check",
              description:
                "A Bloblang query that should return a boolean value indicating whether a message should end a batch.",
              default: "",
            },
            processors: {
              type: "processor_list",
              title: "Processors",
              description:
                "A list of processors to apply to a batch as it is flushed.",
              default: [],
            },
          },
        },
      },
    },
    sql_insert: {
      title: "SQL Insert",
      description: "Inserts a row into an SQL database for each message.",
      properties: {
        driver: {
          type: "select",
          title: "Driver",
          description: "A database driver to use.",
          options: [
            "mysql",
            "postgres",
            "clickhouse",
            "mssql",
            "sqlite",
            "oracle",
            "snowflake",
            "trino",
            "gocosmos",
            "spanner",
          ],
          required: true,
        },
        dsn: {
          type: "input",
          title: "DSN",
          description: "A Data Source Name to identify the target database.",
          required: true,
        },
        table: {
          type: "input",
          title: "Table",
          description: "The table to insert into.",
          required: true,
        },
        columns: {
          type: "array",
          title: "Columns",
          description: "A list of columns to insert.",
          required: true,
          default: [],
        },
        args_mapping: {
          type: "code",
          title: "Args Mapping",
          description:
            "A Bloblang mapping which should evaluate to an array of values matching in size to the number of columns specified.",
          required: true,
        },
        max_in_flight: {
          type: "number",
          title: "Max In Flight",
          description: "The maximum number of inserts to run in parallel.",
          default: 64,
        },
        batching: {
          type: "object",
          title: "Batching",
          description: "Allows you to configure a batching policy.",
          properties: {
            count: {
              type: "number",
              title: "Count",
              description:
                "A number of messages at which the batch should be flushed. If 0 disables count based batching.",
              default: 0,
            },
            byte_size: {
              type: "number",
              title: "Byte Size",
              description:
                "An amount of bytes at which the batch should be flushed. If 0 disables size based batching.",
              default: 0,
            },
            period: {
              type: "input",
              title: "Period",
              description:
                "A period in which an incomplete batch should be flushed regardless of its size.",
              default: "",
            },
            jitter: {
              type: "number",
              title: "Jitter",
              description:
                "A non-negative factor that adds random delay to batch flush intervals.",
              default: 0,
            },
            check: {
              type: "input",
              title: "Check",
              description:
                "A Bloblang query that should return a boolean value indicating whether a message should end a batch.",
              default: "",
            },
          },
        },
      },
    },
  },
  cache: {
    memory: {
      title: "Memory",
      properties: {
        default_ttl: {
          type: "string",
          title: "Default TTL",
          description:
            "The default TTL of each item. After this period an item will be eligible for removal during the next compaction.",
          default: "5m",
        },
        compaction_interval: {
          type: "string",
          title: "Compaction Interval",
          description:
            "The period of time to wait before each compaction, at which point expired items are removed. Set to empty string to disable compactions/expiry.",
          default: "60s",
        },
        init_values: {
          type: "object",
          title: "Init Values",
          description:
            "A table of key/value pairs that should be present in the cache on initialization.",
          default: "{}",
        },
        shards: {
          type: "number",
          title: "Shards",
          description:
            "A number of logical shards to spread keys across, increasing the shards can have a performance benefit.",
          default: 1,
        },
      },
    },
    redis: {
      title: "Redis",
      properties: {
        url: {
          type: "string",
          title: "URL",
          description:
            "The URL of the target Redis server. Database is optional and is supplied as the URL path.",
          required: true,
        },
        kind: {
          type: "string",
          title: "Kind",
          description:
            "Specifies a simple, cluster-aware, or failover-aware redis client.",
          options: ["simple", "cluster", "failover"],
          default: "simple",
        },
        master: {
          type: "string",
          title: "Master",
          description: "Name of the redis master when kind is failover",
          default: "",
        },
        tls: {
          type: "object",
          title: "TLS",
          description:
            "Custom TLS settings can be used to override system defaults.",
          properties: {
            enabled: {
              type: "boolean",
              title: "Enabled",
              description: "Whether custom TLS settings are enabled.",
              default: false,
            },
            skip_cert_verify: {
              type: "boolean",
              title: "Skip Cert Verify",
              description:
                "Whether to skip server side certificate verification.",
              default: false,
            },
            enable_renegotiation: {
              type: "boolean",
              title: "Enable Renegotiation",
              description:
                "Whether to allow the remote server to repeatedly request renegotiation.",
              default: false,
            },
            root_cas: {
              type: "string",
              title: "Root CAs",
              description: "An optional root certificate authority to use.",
              default: "",
            },
            root_cas_file: {
              type: "string",
              title: "Root CAs File",
              description:
                "An optional path of a root certificate authority file to use.",
              default: "",
            },
            client_certs: {
              type: "array",
              title: "Client Certs",
              description: "A list of client certificates to use.",
              default: "[]",
            },
          },
        },
        prefix: {
          type: "string",
          title: "Prefix",
          description:
            "An optional string to prefix item keys with in order to prevent collisions with similar services.",
          default: "",
        },
        default_ttl: {
          type: "string",
          title: "Default TTL",
          description:
            "An optional default TTL to set for items, calculated from the moment the item is cached.",
          default: "",
        },
        retries: {
          type: "object",
          title: "Retries",
          description:
            "Determine time intervals and cut offs for retry attempts.",
          properties: {
            initial_interval: {
              type: "string",
              title: "Initial Interval",
              description: "The initial period to wait between retry attempts.",
              default: "500ms",
            },
            max_interval: {
              type: "string",
              title: "Max Interval",
              description: "The maximum period to wait between retry attempts.",
              default: "1s",
            },
            max_elapsed_time: {
              type: "string",
              title: "Max Elapsed Time",
              description:
                "The maximum overall period of time to spend on retry attempts before the request is aborted.",
              default: "5s",
            },
          },
        },
      },
    },
    memcached: {
      title: "Memcached",
      properties: {
        addresses: {
          type: "array",
          title: "Addresses",
          description: "A list of addresses of memcached servers to use.",
          required: true,
          default: "[]",
        },
        prefix: {
          type: "string",
          title: "Prefix",
          description:
            "An optional string to prefix item keys with in order to prevent collisions with similar services.",
          default: "",
        },
        default_ttl: {
          type: "string",
          title: "Default TTL",
          description:
            "A default TTL to set for items, calculated from the moment the item is cached.",
          default: "300s",
        },
        retries: {
          type: "object",
          title: "Retries",
          description:
            "Determine time intervals and cut offs for retry attempts.",
          properties: {
            initial_interval: {
              type: "string",
              title: "Initial Interval",
              description: "The initial period to wait between retry attempts.",
              default: "1s",
            },
            max_interval: {
              type: "string",
              title: "Max Interval",
              description: "The maximum period to wait between retry attempts.",
              default: "5s",
            },
            max_elapsed_time: {
              type: "string",
              title: "Max Elapsed Time",
              description:
                "The maximum overall period of time to spend on retry attempts before the request is aborted.",
              default: "30s",
            },
          },
        },
      },
    },
    file: {
      title: "File",
      properties: {
        directory: {
          type: "string",
          title: "Directory",
          description: "The directory within which to store items as files.",
          required: true,
        },
      },
    },
    lru: {
      title: "LRU",
      properties: {
        cap: {
          type: "number",
          title: "Capacity",
          description: "The maximum number of items to store in the cache.",
          required: true,
          default: 1024,
        },
        init_values: {
          type: "object",
          title: "Init Values",
          description:
            "A table of key/value pairs that should be present in the cache on initialization.",
          default: "{}",
        },
      },
    },
    ttlru: {
      title: "TTLRU",
      properties: {
        cap: {
          type: "number",
          title: "Capacity",
          description: "The maximum number of items to store in the cache.",
          required: true,
          default: 1024,
        },
        default_ttl: {
          type: "string",
          title: "Default TTL",
          description: "The default TTL of each item.",
          default: "5m",
        },
        init_values: {
          type: "object",
          title: "Init Values",
          description:
            "A table of key/value pairs that should be present in the cache on initialization.",
          default: "{}",
        },
      },
    },
    ristretto: {
      title: "Ristretto",
      properties: {
        default_ttl: {
          type: "string",
          title: "Default TTL",
          description: "The default TTL of each item.",
          default: "5m",
        },
        max_cost: {
          type: "number",
          title: "Max Cost",
          description: "The maximum size of the cache in bytes.",
          default: 1073741824,
        },
        num_counters: {
          type: "number",
          title: "Num Counters",
          description:
            "The number of 4-bit access counters to keep for admission and eviction.",
          default: 10000000,
        },
      },
    },
    noop: {
      title: "Noop",
      properties: {},
    },
  },
  rate_limit: {
    coordinator: {
      title: "Coordinator",
      properties: {
        count: {
          type: "number",
          title: "Count",
          description: "Number of requests allowed per interval.",
          required: true,
          default: 10,
          min: 1,
        },
        interval: {
          type: "select",
          title: "Interval",
          description: "Time interval for rate limiting.",
          options: [
            "1s",
            "5s",
            "10s",
            "30s",
            "1m",
            "5m",
            "10m",
            "30m",
            "1h",
            "2h",
            "6h",
            "12h",
            "24h",
          ],
          default: "1s",
          required: true,
        },
        burst: {
          type: "number",
          title: "Burst",
          description: "Additional burst capacity for handling traffic spikes.",
          default: 0,
          min: 0,
        },
      },
    },
  },
};

// Component lists for each type
export const componentLists = {
  input: [
    "generate",
    "http_client",
    "http_server",
    "kafka",
    "broker",
    "mysql_replication",
    "shopify",
  ],
  pipeline: [
    "mapping",
    "json_schema",
    "catch",
    "switch",
    "schema_registry_decode",
  ],
  output: [
    "http_client",
    "kafka",
    "sync_response",
    "switch",
    "broker",
    "sql_insert",
  ],
  cache: [
    "memory",
    "redis",
    "memcached",
    "file",
    "lru",
    "ttlru",
    "ristretto",
    "noop",
  ],
  rate_limit: ["coordinator"],
};
