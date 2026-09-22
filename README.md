# 🤖 Coworker

A modern, high-performance AI chat interface for collaborating with AI assistants.

<p align="center">
  <img src="assets/logo.svg" alt="Coworker Logo" width="128" />
</p>

## ✨ Features

- 💬 **Modern Chat UI** - Clean, responsive interface built with React 19
- ⚡ **High Performance** - Rust-powered file operations (10x faster)
- 🛠️ **Integrated Terminal** - Real shell with xterm.js
- 📁 **File Explorer** - Fast file tree with bundled Rust tools
- 🔍 **Instant Search** - Powered by ripgrep
- 🎨 **Beautiful Themes** - Light and dark mode
- 📦 **Self-Contained** - All tools bundled, no installation needed

## 🚀 Quick Start

### Download

Download the latest release for your platform:

- **macOS**: `Coworker-x.x.x.dmg`
- **Linux**: `Coworker-x.x.x.AppImage`
- **Windows**: `Coworker-x.x.x.exe`

### From Source

```bash
# Clone the repository
git clone https://github.com/0xrameshh/coworker.git
cd coworker

# Install dependencies (needs Node 22; see .nvmrc)
bun install

# Download the bundled tools (fd, ripgrep, bat)
bash scripts/download-binaries.sh

# Build the Rust backend
cargo build --release

# Start development server
bun run dev

# Build for production
bun run build

# Create distributable
bun run dist:mac    # macOS
bun run dist:linux  # Linux
bun run dist:win    # Windows
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Backend | Electron, Node.js |
| AI | Claude Code via Anthropic SDK |
| Performance | Rust (fd, ripgrep, bat, napi-rs) |
| Terminal | xterm.js |
| Build | Vite, Electron Builder |

## 📦 Bundled Rust Tools

Coworker includes high-performance Rust tools - no installation required!

| Tool | Purpose | Performance |
|------|---------|-------------|
| [fd](https://github.com/sharkdp/fd) | File finder | 10-50x faster than `ls` |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Content search | Fastest grep alternative |
| [bat](https://github.com/sharkdp/bat) | Syntax cat | Better than `cat` |
| **Native Module** | Custom ops | 10x faster Node.js |

## 🏗️ Architecture

```
coworker/
├── src/
│   ├── electron/        # Electron main process
│   │   ├── libs/        # File operations (fd, rg, native)
│   │   ├── ipc-handlers.ts
│   │   └── main.ts
│   ├── ui/              # React frontend
│   │   ├── components/  # UI components
│   │   ├── store/       # Zustand state
│   │   └── hooks/       # Custom hooks
│   └── types.d.ts       # TypeScript definitions
├── native/              # Rust native module (napi-rs)
│   ├── src/
│   │   ├── lib.rs       # Entry point
│   │   ├── git.rs       # Git operations
│   │   └── lsp.rs       # LSP server
│   └── Cargo.toml
├── scripts/             # Build scripts
│   └── download-binaries.sh
├── bin/                 # Bundled Rust binaries
├── dist-react/          # Built React app
├── dist-electron/       # Built Electron app
└── package.json
```

## 🎯 Key Features

### Chat Interface
- Modern message bubbles with syntax highlighting
- Code block support with language detection
- Streaming responses
- Rich markdown rendering

### File Explorer
- Fast file tree built with `fd`
- File search with ripgrep
- File icons and type indicators
- Context menu actions

### Terminal
- Real shell via xterm.js
- Multiple tabs
- Command history
- Custom theming

### Settings
- Theme switching (light/dark/system)
- Provider configuration
- Keyboard shortcuts

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + \` | Toggle sidebar |
| `Ctrl/Cmd + `` ` | Toggle terminal |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + R` | Search command history |
| `Ctrl/Cmd + L` | Clear terminal |

## 🧩 Development

### Project Structure

```
src/
├── electron/           # Main process
│   ├── libs/
│   │   ├── fd.ts       # File finder wrapper
│   │   ├── rg.ts       # Search wrapper
│   │   ├── runner.ts   # Claude runner
│   │   └── session-store.ts
│   ├── ipc-handlers.ts # IPC handlers
│   ├── main.ts         # Entry point
│   └── types.ts        # TypeScript types
├── ui/                 # Renderer process
│   ├── App.tsx         # Main app component
│   ├── components/     # React components
│   │   ├── Chat.tsx
│   │   ├── Terminal.tsx
│   │   ├── FileTree.tsx
│   │   └── Sidebar.tsx
│   ├── store/          # State management
│   └── hooks/          # Custom hooks
└── types.d.ts          # Global types
```

### Adding New Features

1. **Frontend**: Add component in `src/ui/components/`
2. **Backend**: Add handler in `src/electron/`
3. **IPC**: Define types in `src/electron/types.ts`
4. **Rust Native**: Add function in `native/src/lib.rs`

### Building Native Module

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build for current platform
cd native
cargo build --release

# Build for all platforms
cargo build --release --target x86_64-apple-darwin
cargo build --release --target x86_64-unknown-linux-gnu
cargo build --release --target x86_64-pc-windows-msvc
```

## 📝 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Rust Integration](RUST_INTEGRATION.md)
- [Bundled Tools](BUNDLED_TOOLS.md)
- [Contributing](CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with:
- [React](https://reactjs.org/)
- [Electron](https://www.electronjs.org/)
- [Claude Code](https://claude.com/code)
- [xterm.js](https://xtermjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Rust](https://www.rust-lang.org/)
- [Vite](https://vitejs.dev/)

---

**Coworker** - Build faster with AI. 🚀
