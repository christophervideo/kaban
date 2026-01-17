<p align="center">
  <img src="docs/assets/icon.png" alt="Kaban" width="120" height="120">
</p>

<h1 align="center">Kaban</h1>

<p align="center">
  <strong>Kanban for AI Agents</strong><br>
  Track and coordinate tasks between humans and AI in the terminal
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#mcp-integration">MCP Integration</a> •
  <a href="#cli-usage">CLI</a> •
  <a href="#tui-usage">TUI</a> •
  <a href="#configuration">Config</a>
</p>

---

## What is Kaban?

Kaban is a terminal-based Kanban board designed for **AI code agents** and developers. It provides a structured way to manage tasks, track progress, and coordinate between human users and AI agents.

**Why Kaban?**

- **MCP Native** — First-class integration with Claude Desktop and MCP-compatible AI agents
- **Terminal First** — Beautiful TUI + powerful CLI, no browser needed
- **Human + AI** — Track who created each task (you, Claude, or other agents)
- **Zero Config** — SQLite-based, portable, works offline

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **MCP Server** | AI agents can read, create, and manage tasks autonomously |
| ⌨️ **Interactive TUI** | Vim-style navigation, keyboard-driven workflow |
| 🔧 **Powerful CLI** | Scriptable commands for automation |
| 📊 **WIP Limits** | Built-in Kanban best practices |
| 👥 **Agent Tracking** | See who (human or AI) owns each task |
| 📦 **Portable** | Single SQLite file, no server required |

## Quick Start

```bash
# Clone and install
git clone https://github.com/beshkenadze/kaban
cd kaban
bun install && bun run build

# Initialize in your project
cd /path/to/your/project
kaban init --name "My Project"

# Add a task
kaban add "Implement feature X" --agent claude

# Launch the TUI
kaban tui
```

## Packages

Kaban is a monorepo with three packages:

| Package | Description |
|---------|-------------|
| `@kaban/core` | Database logic, services, and schemas |
| `@kaban/cli` | CLI commands, TUI launcher, MCP server |
| `@kaban/tui` | Interactive Terminal User Interface |

## Installation

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Task](https://taskfile.dev/) (optional)

### With Task (Recommended)

```bash
git clone https://github.com/beshkenadze/kaban
cd kaban
task install
```

### Manual

```bash
git clone https://github.com/beshkenadze/kaban
cd kaban
bun install
bun run build

# Option 1: Add alias
alias kaban="bun run $(pwd)/packages/cli/src/index.ts"

# Option 2: Link globally
ln -s $(pwd)/packages/cli/src/index.ts /usr/local/bin/kaban
```

### Task Commands

| Command | Description |
|---------|-------------|
| `task install` | Build and install to /usr/local/bin |
| `task uninstall` | Remove from system |
| `task update` | Rebuild and reinstall |
| `task build` | Build all packages |
| `task dev:tui` | Run TUI in dev mode |

## MCP Integration

Connect your AI coding assistant to Kaban via [Model Context Protocol](https://modelcontextprotocol.io/).

### Claude Desktop Setup

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kaban": {
      "command": "kaban",
      "args": ["mcp"],
      "env": {
        "KABAN_PATH": "/path/to/your/project"
      }
    }
  }
}
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `kaban_init` | Initialize a new board |
| `kaban_add_task` | Add a task |
| `kaban_get_task` | Get task details |
| `kaban_list_tasks` | List tasks with filters |
| `kaban_move_task` | Move task to column |
| `kaban_update_task` | Update task properties |
| `kaban_delete_task` | Delete a task |
| `kaban_complete_task` | Mark task as done |
| `kaban_status` | Get board summary |

### MCP Resources

| Resource | Description |
|----------|-------------|
| `kaban://board/status` | Board status with counts |
| `kaban://board/columns` | Available columns |
| `kaban://tasks/{columnId}` | Tasks in a column |
| `kaban://task/{id}` | Single task details |

## CLI Usage

```bash
kaban <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `kaban init` | Initialize a board |
| `kaban add <title>` | Add a task |
| `kaban list` | List tasks |
| `kaban move <id> [column]` | Move a task |
| `kaban done <id>` | Mark task complete |
| `kaban status` | Show board summary |
| `kaban tui` | Launch interactive UI |
| `kaban mcp` | Start MCP server |

### Examples

```bash
# Initialize with custom name
kaban init --name "Sprint 1"

# Add task with metadata
kaban add "Fix auth bug" -c todo -a claude -D "OAuth2 flow broken"

# List tasks in a column
kaban list --column in-progress

# Move task to next column
kaban move abc123 --next

# Mark complete
kaban done abc123
```

## TUI Usage

Launch the interactive terminal UI:

```bash
kaban tui
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` / `h` `l` | Navigate columns |
| `↑` `↓` / `j` `k` | Navigate tasks |
| `Enter` | View task details |
| `a` | Add new task |
| `e` | Edit task |
| `m` | Move task |
| `u` | Assign user/agent |
| `d` | Delete task |
| `?` | Show help |
| `q` | Quit |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KABAN_PATH` | Board data directory | Current directory |
| `KABAN_AGENT` | Default agent name | `user` |

### Data Storage

Kaban stores data in `.kaban/` directory:

```
.kaban/
├── board.db      # SQLite database
└── config.json   # Board configuration
```

### Default Columns

| Column | WIP Limit |
|--------|-----------|
| Backlog | — |
| To Do | — |
| In Progress | 3 |
| Review | 2 |
| Done | — (terminal) |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Development
bun install
bun run build
bun run lint
bun run test
```

## License

[MIT](LICENSE) © Kaban Contributors
