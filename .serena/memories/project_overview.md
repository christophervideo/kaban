# Kaban TUI

Terminal Kanban board for AI Code Agents and humans.

## Tech Stack

- **Language:** TypeScript (strict)
- **Runtime:** Bun
- **TUI Framework:** OpenTUI + @opentui/react
- **Database:** SQLite + Drizzle ORM
- **CLI:** Commander.js or Bun built-in
- **MCP:** @modelcontextprotocol/sdk
- **IDs:** ULID

## Packages (Monorepo)

- `@kaban/core` — Business logic, database, types
- `@kaban/cli` — Command-line interface
- `@kaban/tui` — Terminal UI
- `@kaban/mcp` — MCP server for agents

## Key Features

- Multi-agent safe (optimistic locking)
- CLI + TUI + MCP interfaces
- Task dependencies
- Custom columns via config

## Project Structure

```
packages/
  core/        # Business logic
  cli/         # CLI commands
  tui/         # Terminal UI
  mcp/         # MCP server
docs/
  spec.md      # Full specification
  tui-research.md
```

See `docs/spec.md` for full specification.