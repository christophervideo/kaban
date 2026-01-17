# LibSQL/Turso Realtime Sync for TUI - Research Report

**Date**: 2026-01-16
**Context**: KabanProject - CLI and TUI processes sharing local SQLite/LibSQL database

## Executive Summary

**The core challenge**: Two processes (CLI and TUI) accessing the same local SQLite/LibSQL database file, wanting TUI to see changes made by CLI in realtime.

**Key finding**: LibSQL/Turso's sync features are designed for **remote ↔ local replica** synchronization, NOT for **local process ↔ local process** communication. For local-only scenarios, different approaches are needed.

---

## Understanding the Architecture Problem

### What Turso Embedded Replicas Actually Do
- Sync between a **remote Turso cloud database** and a **local embedded replica**
- The `syncInterval` and `db.sync()` methods pull changes **from remote → local**
- Designed for scenarios like: mobile app ↔ cloud, edge server ↔ cloud

### Local-Only Scenario
```
CLI Process ──writes──► SQLite DB File ◄──reads── TUI Process
```

This is a **cross-process local file** scenario - SQLite/LibSQL handles via file locking, but **has no built-in push notification mechanism**.

---

## Recommended Solutions (Ranked by Simplicity)

### **Option 1: Polling with `PRAGMA data_version` (Recommended)**

Most reliable cross-process change detection for SQLite:

```typescript
let lastDataVersion: number | null = null;

async function pollForChanges(db: DB) {
  const client = (db as unknown as { $client: Client }).$client;
  const result = await client.execute("PRAGMA data_version");
  const currentVersion = result.rows[0]?.[0] as number;
  
  if (lastDataVersion !== null && currentVersion !== lastDataVersion) {
    // Database changed by another process!
    await refreshBoard(state);
  }
  lastDataVersion = currentVersion;
}

// Poll every 500ms-1000ms
setInterval(() => pollForChanges(db), 500);
```

**Key insight**: `PRAGMA data_version` returns a value that **increments on every commit from another connection**. Designed specifically for cross-process change detection. Extremely lightweight - just reads an integer from the WAL.

**Pros**: Simple, reliable, works with WAL mode, low overhead
**Cons**: Not instant (500ms-1s latency), slight CPU usage from polling

---

### **Option 2: File System Watching + data_version**

Combine OS-level file watching with `data_version` for faster detection:

```typescript
import { watch } from "node:fs";

const dbPath = getKabanPaths(projectRoot).dbPath;

// Watch the WAL file for changes
watch(dbPath + "-wal", { persistent: false }, async (event) => {
  if (event === "change") {
    await pollForChanges(db); // Only refresh if data_version changed
  }
});
```

**Caveat**: File watching in WAL mode can be unreliable - changes may not always trigger filesystem events. Use as an **optimization on top of polling**, not a replacement.

---

### **Option 3: Shared Memory / IPC Channel**

Create explicit notification channel between CLI and TUI:
- Unix socket: CLI sends "refresh" message after each write
- Named pipe (FIFO)
- Bun's built-in IPC (if both processes spawned from same parent)

**Pros**: Instant notifications
**Cons**: More complex, need to modify CLI to emit notifications

---

### **Option 4: Turso Remote Server (Cloud Sync)**

If using Turso's cloud service:

```typescript
// Both CLI and TUI connect to remote Turso
const client = createClient({
  url: "libsql://your-db.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// TUI polls with syncInterval
const tuiClient = createClient({
  url: "file:local-replica.db",
  syncUrl: "libsql://your-db.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
  syncInterval: 1, // 1 second
});
```

**Pros**: True sync architecture, works across machines
**Cons**: Requires internet, Turso account, adds latency

---

## Why Update Hooks Won't Work

`sqlite3_update_hook()` is **same-process only**:

> "The update_hook is registered on a connection, it can only intercept changes invoked on said connection. It cannot access any changes made outside of that connection."

TUI process can't use update hooks to detect CLI changes.

**bun:sqlite status**: Update hook support is an open feature request (GitHub issue #4175), not yet implemented.

---

## Implementation for KabanProject TUI

```typescript
// packages/tui/src/index.ts - Add polling for changes

async function main() {
  // ... existing setup code ...

  const state: AppState = { /* ... */ };
  await refreshBoard(state);

  // Add change detection polling
  let lastDataVersion: number | null = null;
  const client = (db as unknown as { $client: Client }).$client;

  const checkForChanges = async () => {
    try {
      const result = await client.execute("PRAGMA data_version");
      const currentVersion = result.rows[0]?.[0] as number;
      
      if (lastDataVersion !== null && currentVersion !== lastDataVersion) {
        await refreshBoard(state);
      }
      lastDataVersion = currentVersion;
    } catch {
      // DB might be locked momentarily
    }
  };

  const pollInterval = setInterval(checkForChanges, 500);

  // Clean up on exit
  process.on("exit", () => clearInterval(pollInterval));

  renderer.keyInput.on("keypress", /* ... */);
}
```

---

## Sources

- Embedded Replicas - Turso Docs: https://docs.turso.tech/features/embedded-replicas/introduction
- SQLite PRAGMA data_version: https://www.sqlite.org/pragma.html
- SQLite Forum: Cross process change notification: https://sqlite.org/forum/info/d2586c18e7197c39c9a9ce7c6c411507c3d1e786a2c4889f996605b236fec1b7
- SQLite Update Hook Limitations: https://sqlite.org/c3ref/update_hook.html
- bun:sqlite Update Hook Request: https://github.com/oven-sh/bun/issues/4175
- Turso Offline Sync Beta: https://turso.tech/blog/turso-offline-sync-public-beta
- fswatch WAL mode issues: https://github.com/emcrisostomo/fswatch/issues/150
