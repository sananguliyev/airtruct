// Component schemas with nested configuration support
export const componentSchemas = {
  input: {
    generate: {
      mapping: {
        type: "code",
        title: "Mapping",
        description: "A bloblang mapping to use for generating messages.",
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
    http_client: {
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
    kafka: {
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
  pipeline: {
    mapping: {
      flat: true,
      mapping: {
        type: "code",
        title: "Mapping",
        description: "A bloblang mapping to apply to messages.",
      },
    },
  },
  output: {
    http_client: {
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
        description: "Whether to propagate the response from the HTTP request",
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
    kafka: {
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
        description: "An optional key to set for each message (interpolated).",
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
};

// Component lists for each type
export const componentLists = {
  input: ["generate", "http_client", "kafka"],
  pipeline: ["mapping"],
  output: ["http_client", "kafka"],
};
