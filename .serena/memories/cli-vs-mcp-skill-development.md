# Claude Skill Development: CLI vs MCP Tools

## Quick Decision Guide

| Scenario | Use | Why |
|----------|-----|-----|
| Local tools (kaban, git, npm) | **CLI + Skill** | No external access needed, token-efficient |
| External APIs (GitHub, Slack) | **MCP** | Requires authenticated external access |
| Local databases (SQLite) | **CLI + Skill** | CLI tools work perfectly |
| Real-time external data | **MCP** | Skills can't reach outside |

## Key Principle

```
Skill teaches HOW to use → CLI tool DOES the action
```

## Context Efficiency

| Approach | Token Overhead |
|----------|----------------|
| CLI via Skills | ~100-500 tokens (metadata only) |
| MCP Tools | ~5k-15k tokens (full schemas) |

## Best Practices for Skill Development

1. **Always use installed CLI** (`which <tool>` first)
2. **Never bypass CLI** with direct file access
3. **Never use dev commands** (`bun run`, `npx ts-node`)
4. **Reference MCP only when server running** (`<tool> mcp`)

## Why CLI + Skill Wins

1. **Token efficient** - only skill metadata loaded initially
2. **Stable** - MCP tool descriptions change frequently
3. **Controllable** - you own the skill, can fix issues
4. **Simple** - no external server dependencies

## Architecture Pattern

```
Claude Agent
    │ reads
    ▼
Skill (SKILL.md)
    │ teaches when/how
    ▼
Bash tool
    │ executes
    ▼
CLI binary (installed)
    │ operates on
    ▼
Local data/files
```

## Sources

- Armin Ronacher: lucumr.pocoo.org/2025/12/13/skills-vs-mcp/
- Simon Willison: simonwillison.net/2025/Oct/16/claude-skills/
- IntuitionLabs: intuitionlabs.ai/articles/claude-skills-vs-mcp
- Claude Code Docs: code.claude.com/docs/en/skills
