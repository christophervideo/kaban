# TUI Libraries Research — Kanban Board

**Decision:** Using [OpenTUI](https://github.com/anomalyco/opentui)

## OpenTUI Overview

TypeScript library for building terminal user interfaces. Powers [opencode](https://opencode.ai) and terminaldotshop.

### Packages
- `@opentui/core` — Standalone imperative API + base primitives
- `@opentui/solid` — SolidJS reconciler
- `@opentui/react` — React reconciler

### Requirements
- **Bun** (recommended package manager)
- **Zig** (must be installed for build)

### Quick Start
```bash
bun create tui
# or
bun install @opentui/core
```

### Status
- 7.5k GitHub stars
- Active development, not yet "production-ready" per README
- TypeScript native (68.2%), Zig for performance (31.0%)

---

## Alternatives Considered

| Library | Paradigm | Why Not |
|---------|----------|---------|
| [Ink](https://github.com/vadimdemedes/ink) | React + Flexbox | More mature, but OpenTUI is the choice |
| [Blessed](https://github.com/chjj/blessed) | Widget-based | Legacy patterns, unmaintained |
| [Terminal-kit](https://github.com/cronvel/terminal-kit) | Imperative | Too low-level |

---

## Kanban TUI References

| Project | Language | Notes |
|---------|----------|-------|
| [kanban-tui](https://github.com/Zaloog/kanban-tui) | Python | Good feature reference, agent-friendly CLI |
| [twkb](https://github.com/DerTimonius/twkb) | Go (Bubbletea) | Taskwarrior integration |

---

## Resources

- [OpenTUI GitHub](https://github.com/anomalyco/opentui)
- [awesome-opentui](https://github.com/anomalyco/opentui) — Community examples
- [OpenTUI Getting Started Guide](https://github.com/anomalyco/opentui/blob/main/docs/getting-started.md)

---

*Research date: 2026-01-16*
