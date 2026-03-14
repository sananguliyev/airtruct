---
sidebar_position: 1
---

# Installation

Airtruct runs as a single binary with no external dependencies. Choose the method that works best for you.

## Homebrew (macOS / Linux)

```bash
brew install sananguliyev/tap/airtruct
```

## Install Script

Download and install the latest release automatically:

```bash
curl -fsSL https://raw.githubusercontent.com/sananguliyev/airtruct/main/install.sh | sh
```

To install a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/sananguliyev/airtruct/main/install.sh | sh -s 0.1.0
```

## Linux Packages

### Debian / Ubuntu

```bash
curl -LO https://github.com/sananguliyev/airtruct/releases/latest/download/airtruct_<version>_linux_amd64.deb
sudo dpkg -i airtruct_<version>_linux_amd64.deb
```

### RHEL / Fedora / CentOS

```bash
curl -LO https://github.com/sananguliyev/airtruct/releases/latest/download/airtruct_<version>_linux_amd64.rpm
sudo rpm -i airtruct_<version>_linux_amd64.rpm
```

### Alpine

```bash
curl -LO https://github.com/sananguliyev/airtruct/releases/latest/download/airtruct_<version>_linux_amd64.apk
sudo apk add --allow-untrusted airtruct_<version>_linux_amd64.apk
```

Replace `<version>` with the desired release version (e.g. `0.1.0`). Packages are available for `amd64`, `arm64`, and `armv7` architectures.

## Download Binary

1. Go to the [Releases page](https://github.com/sananguliyev/airtruct/releases).
2. Download the appropriate archive for your operating system (Linux, macOS, or Windows).
3. Extract and make it executable (Linux/macOS):

```bash
tar -xzf airtruct_<version>_<os>_<arch>.tar.gz
chmod +x airtruct
```

On Windows, extract the `.zip` and run the `.exe` file directly.

## Docker Compose

If you prefer Docker, use the included `docker-compose.yml`:

```bash
git clone https://github.com/sananguliyev/airtruct.git
cd airtruct
docker-compose up
```

The coordinator will be available at `http://localhost:8080`.

See [Configuration](/docs/getting-started/configuration) for PostgreSQL setup with Docker Compose.

## Verify Installation

```bash
airtruct --help
```

## Next Steps

- Follow the [Quickstart](/docs/getting-started/quickstart) to run your first pipeline.
- Review [Configuration](/docs/getting-started/configuration) for database and port options.
