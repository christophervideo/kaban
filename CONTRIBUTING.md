# Contributing to Kaban

Thanks for your interest in contributing to Kaban!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/beshkenadze/kaban
cd kaban

# Install dependencies
bun install

# Build all packages
bun run build

# Run linting
bun run lint

# Run tests
bun run test
```

## Project Structure

```
packages/
├── core/     # Database, services, schemas
├── cli/      # CLI commands and MCP server
└── tui/      # Terminal UI
```

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run `bun run lint` and `bun run test`
5. Commit with a descriptive message
6. Push and open a Pull Request

## Commit Messages

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Code Style

- TypeScript strict mode
- Biome for linting and formatting
- No `any` types

## Questions?

Open an issue for questions or discussions.
