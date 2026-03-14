#!/bin/sh
set -e

REPO="sananguliyev/airtruct"
BINARY="airtruct"
INSTALL_DIR="/usr/local/bin"

main() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$ARCH" in
        x86_64|amd64) ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        armv7*) ARCH="armv7" ;;
        *) echo "Unsupported architecture: $ARCH" && exit 1 ;;
    esac

    case "$OS" in
        linux|darwin) ;;
        *) echo "Unsupported OS: $OS" && exit 1 ;;
    esac

    if [ -n "$1" ]; then
        VERSION="$1"
    else
        VERSION=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
    fi

    if [ -z "$VERSION" ]; then
        echo "Failed to determine latest version"
        exit 1
    fi

    FILENAME="${BINARY}_${VERSION}_${OS}_${ARCH}.tar.gz"
    URL="https://github.com/${REPO}/releases/download/v${VERSION}/${FILENAME}"

    echo "Downloading ${BINARY} v${VERSION} for ${OS}/${ARCH}..."
    TMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TMP_DIR"' EXIT

    curl -fsSL "$URL" -o "${TMP_DIR}/${FILENAME}"
    tar -xzf "${TMP_DIR}/${FILENAME}" -C "$TMP_DIR"

    if [ -w "$INSTALL_DIR" ]; then
        mv "${TMP_DIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
    else
        echo "Installing to ${INSTALL_DIR} (requires sudo)..."
        sudo mv "${TMP_DIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
    fi

    chmod +x "${INSTALL_DIR}/${BINARY}"
    echo "${BINARY} v${VERSION} installed to ${INSTALL_DIR}/${BINARY}"
}

main "$@"
