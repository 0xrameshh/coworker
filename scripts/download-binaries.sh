#!/bin/bash
# Download pre-built Rust tool binaries for bundling in the Electron app.
# Writes fd, ripgrep, and bat into ./bin for the current platform.

set -euo pipefail

BIN_DIR="$(pwd)/bin"
mkdir -p "$BIN_DIR"

FD_VERSION="v10.2.0"
RG_VERSION="14.1.0"
BAT_VERSION="v0.25.0"

platform="$(uname -s)"
arch="$(uname -m)"

case "$platform" in
    Darwin) os="apple-darwin"; ext="" ;;
    Linux) os="unknown-linux-gnu"; ext="" ;;
    MINGW*|MSYS*|CYGWIN*) os="pc-windows-msvc"; ext=".exe" ;;
    *) echo "Unsupported platform: $platform"; exit 1 ;;
esac

case "$arch" in
    arm64|aarch64) cpu="aarch64" ;;
    x86_64|amd64) cpu="x86_64" ;;
    *) echo "Unsupported architecture: $arch"; exit 1 ;;
esac

download() {
    local url="$1" inner="$2" dest="$3" tmp found
    tmp="$(mktemp -d)"
    case "$url" in
        *.zip)
            curl -sSL "$url" -o "$tmp/archive.zip"
            if command -v unzip >/dev/null 2>&1; then
                unzip -o "$tmp/archive.zip" -d "$tmp" >/dev/null
            else
                powershell -NoProfile -Command "Expand-Archive -LiteralPath '$tmp/archive.zip' -DestinationPath '$tmp/unpacked' -Force" >/dev/null
            fi
            ;;
        *)
            curl -sSL "$url" -o "$tmp/archive.tar.gz"
            tar xzf "$tmp/archive.tar.gz" -C "$tmp"
            ;;
    esac
    found="$(find "$tmp" -type f -name "$(basename "$inner")" | head -n 1)"
    if [ -z "$found" ]; then
        echo "Could not extract $inner from $url"
        exit 1
    fi
    mv "$found" "$dest"
    rm -rf "$tmp"
    chmod +x "$dest" 2>/dev/null || true
    echo "  $(basename "$dest") ready"
}

fd_asset="fd-${FD_VERSION}-${cpu}-${os}"
rg_asset="ripgrep-${RG_VERSION}-${cpu}-${os}"
bat_asset="bat-${BAT_VERSION}-${cpu}-${os}"

echo "Downloading bundled tools for ${platform}-${arch}..."

if [ -n "$ext" ]; then
    download "https://github.com/sharkdp/fd/releases/download/${FD_VERSION}/${fd_asset}.zip" "fd.exe" "$BIN_DIR/fd.exe"
    download "https://github.com/BurntSushi/ripgrep/releases/download/${RG_VERSION}/${rg_asset}.zip" "rg.exe" "$BIN_DIR/rg.exe"
    download "https://github.com/sharkdp/bat/releases/download/${BAT_VERSION}/${bat_asset}.zip" "bat.exe" "$BIN_DIR/bat.exe"
else
    download "https://github.com/sharkdp/fd/releases/download/${FD_VERSION}/${fd_asset}.tar.gz" "fd" "$BIN_DIR/fd"
    download "https://github.com/BurntSushi/ripgrep/releases/download/${RG_VERSION}/${rg_asset}.tar.gz" "rg" "$BIN_DIR/rg"
    download "https://github.com/sharkdp/bat/releases/download/${BAT_VERSION}/${bat_asset}.tar.gz" "bat" "$BIN_DIR/bat"
fi

echo "Bundled tools:"
ls -la "$BIN_DIR"
