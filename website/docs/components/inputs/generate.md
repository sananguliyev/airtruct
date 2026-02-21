# Generate

Generates synthetic messages for testing and development.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Mapping | Bloblang | — | Bloblang mapping to generate message content |
| Interval | string | `1s` | Time interval between messages |
| Count | integer | `0` | Number of messages to generate (0 = unlimited) |
| Batch Size | integer | `1` | Number of messages per batch |
| Auto Replay Nacks | boolean | `true` | Automatically replay rejected messages |
