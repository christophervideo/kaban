# Phase 1: Core + CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundational `@kaban/core` library and `@kaban/cli` with basic task management commands.

**Architecture:** Monorepo with Bun workspaces. Core package handles all business logic, database access, and validation. CLI is a thin layer that parses arguments and calls core functions. SQLite with Drizzle ORM for persistence. ULID for task IDs.

**Tech Stack:** Bun, TypeScript (strict), Drizzle ORM, SQLite (better-sqlite3), ULID, Commander.js

---

## Task 1: Monorepo Setup

**Files:**
- Create: `package.json` (root)
- Create: `bunfig.toml`
- Create: `tsconfig.json` (root)
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`

**Step 1: Create root package.json with workspaces**

```json
{
  "name": "kaban",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "bun run --filter '*' build",
    "test": "bun run --filter '*' test",
    "typecheck": "bun run --filter '*' typecheck"
  }
}
```

**Step 2: Create bunfig.toml**

```toml
[install]
peer = false

[install.scopes]
"@kaban" = { token = "", url = "" }
```

**Step 3: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 4: Create packages/core/package.json**

```json
{
  "name": "@kaban/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.38.0",
    "better-sqlite3": "^11.0.0",
    "ulid": "^2.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 5: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 6: Create packages/cli/package.json**

```json
{
  "name": "@kaban/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "kaban": "./dist/index.js"
  },
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@kaban/core": "workspace:*",
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Step 7: Create packages/cli/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 8: Install dependencies**

Run: `bun install`

**Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: initialize monorepo with bun workspaces"
```

---

## Task 2: Core Types

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/index.ts`

**Step 1: Write types**

```typescript
// packages/core/src/types.ts

export interface Task {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  position: number;
  createdBy: string;
  assignedTo: string | null;
  parentId: string | null;
  dependsOn: string[];
  files: string[];
  labels: string[];
  blockedReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface Column {
  id: string;
  name: string;
  position: number;
  wipLimit: number | null;
  isTerminal: boolean;
}

export interface Board {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Config {
  board: {
    name: string;
  };
  columns: Array<{
    id: string;
    name: string;
    wipLimit?: number;
    isTerminal?: boolean;
  }>;
  defaults: {
    column: string;
    agent: string;
  };
}

export const DEFAULT_CONFIG: Config = {
  board: {
    name: "Kaban Board",
  },
  columns: [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "Todo" },
    { id: "in_progress", name: "In Progress", wipLimit: 3 },
    { id: "review", name: "Review" },
    { id: "done", name: "Done", isTerminal: true },
  ],
  defaults: {
    column: "todo",
    agent: "user",
  },
};

export class KabanError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = "KabanError";
  }
}

export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_FOUND: 2,
  CONFLICT: 3,
  VALIDATION: 4,
} as const;
```

**Step 2: Create barrel export**

```typescript
// packages/core/src/index.ts
export * from "./types.js";
```

**Step 3: Run typecheck**

Run: `cd packages/core && bun run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/core/src/
git commit -m "feat(core): add type definitions"
```

---

## Task 3: Database Schema

**Files:**
- Create: `packages/core/src/db/schema.ts`
- Create: `packages/core/src/db/index.ts`

**Step 1: Write Drizzle schema**

```typescript
// packages/core/src/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  wipLimit: integer("wip_limit"),
  isTerminal: integer("is_terminal", { mode: "boolean" }).notNull().default(false),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  columnId: text("column_id")
    .notNull()
    .references(() => columns.id),
  position: integer("position").notNull(),
  createdBy: text("created_by").notNull(),
  assignedTo: text("assigned_to"),
  parentId: text("parent_id").references((): ReturnType<typeof text> => tasks.id),
  dependsOn: text("depends_on", { mode: "json" }).$type<string[]>().notNull().default([]),
  files: text("files", { mode: "json" }).$type<string[]>().notNull().default([]),
  labels: text("labels", { mode: "json" }).$type<string[]>().notNull().default([]),
  blockedReason: text("blocked_reason"),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const undoLog = sqliteTable("undo_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  operation: text("operation").notNull(),
  data: text("data", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

**Step 2: Create database connection module**

```typescript
// packages/core/src/db/index.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema.js";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export * from "./schema.js";

export type DB = ReturnType<typeof createDb>;

export function createDb(dbPath: string) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  return drizzle(sqlite, { schema });
}

export function initializeSchema(db: DB) {
  const sqlite = (db as unknown as { $client: Database.Database }).$client;

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id),
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      wip_limit INTEGER,
      is_terminal INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      column_id TEXT NOT NULL REFERENCES columns(id),
      position INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      assigned_to TEXT,
      parent_id TEXT REFERENCES tasks(id),
      depends_on TEXT NOT NULL DEFAULT '[]',
      files TEXT NOT NULL DEFAULT '[]',
      labels TEXT NOT NULL DEFAULT '[]',
      blocked_reason TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      started_at INTEGER,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS undo_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
  `);
}
```

**Step 3: Update barrel export**

```typescript
// packages/core/src/index.ts
export * from "./types.js";
export * from "./db/index.js";
```

**Step 4: Run typecheck**

Run: `cd packages/core && bun run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/core/src/db/
git add packages/core/src/index.ts
git commit -m "feat(core): add database schema with Drizzle"
```

---

## Task 4: Validation Utilities

**Files:**
- Create: `packages/core/src/validation.ts`
- Create: `packages/core/src/validation.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/validation.test.ts
import { describe, test, expect } from "bun:test";
import {
  validateTitle,
  validateAgentName,
  validateColumnId,
  isValidUlid,
} from "./validation.js";
import { KabanError, ExitCode } from "./types.js";

describe("validateTitle", () => {
  test("accepts valid title", () => {
    expect(() => validateTitle("Fix the bug")).not.toThrow();
  });

  test("rejects empty title", () => {
    expect(() => validateTitle("")).toThrow(KabanError);
  });

  test("rejects title over 200 chars", () => {
    const longTitle = "a".repeat(201);
    expect(() => validateTitle(longTitle)).toThrow(KabanError);
  });

  test("trims whitespace", () => {
    expect(validateTitle("  hello  ")).toBe("hello");
  });
});

describe("validateAgentName", () => {
  test("accepts valid names", () => {
    expect(() => validateAgentName("user")).not.toThrow();
    expect(() => validateAgentName("claude-code")).not.toThrow();
    expect(() => validateAgentName("agent_1")).not.toThrow();
    expect(() => validateAgentName("GPT4")).not.toThrow();
  });

  test("rejects invalid names", () => {
    expect(() => validateAgentName("my agent")).toThrow(KabanError);
    expect(() => validateAgentName("@claude")).toThrow(KabanError);
    expect(() => validateAgentName("")).toThrow(KabanError);
    expect(() => validateAgentName("1agent")).toThrow(KabanError);
  });
});

describe("validateColumnId", () => {
  test("accepts valid column IDs", () => {
    expect(() => validateColumnId("todo")).not.toThrow();
    expect(() => validateColumnId("in_progress")).not.toThrow();
  });

  test("rejects invalid column IDs", () => {
    expect(() => validateColumnId("In Progress")).toThrow(KabanError);
    expect(() => validateColumnId("")).toThrow(KabanError);
  });
});

describe("isValidUlid", () => {
  test("accepts valid ULID", () => {
    expect(isValidUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(true);
  });

  test("rejects invalid ULID", () => {
    expect(isValidUlid("invalid")).toBe(false);
    expect(isValidUlid("")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && bun test validation.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// packages/core/src/validation.ts
import { KabanError, ExitCode } from "./types.js";

const TITLE_MAX = 200;
const AGENT_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/;
const COLUMN_ID_REGEX = /^[a-z][a-z0-9_]*$/;
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new KabanError("Title cannot be empty", ExitCode.VALIDATION);
  }
  if (trimmed.length > TITLE_MAX) {
    throw new KabanError(
      `Title exceeds maximum length of ${TITLE_MAX} characters`,
      ExitCode.VALIDATION,
    );
  }
  return trimmed;
}

export function validateAgentName(name: string): string {
  if (!AGENT_REGEX.test(name)) {
    throw new KabanError(
      `Invalid agent name: '${name}'. Must match: ${AGENT_REGEX}`,
      ExitCode.VALIDATION,
    );
  }
  return name;
}

export function validateColumnId(id: string): string {
  if (!COLUMN_ID_REGEX.test(id)) {
    throw new KabanError(
      `Invalid column ID: '${id}'. Must be lowercase alphanumeric with underscores`,
      ExitCode.VALIDATION,
    );
  }
  return id;
}

export function isValidUlid(id: string): boolean {
  return ULID_REGEX.test(id);
}

export function validateTaskId(id: string): string {
  if (!isValidUlid(id)) {
    throw new KabanError(`Invalid task ID: '${id}'`, ExitCode.VALIDATION);
  }
  return id;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && bun test validation.test.ts`
Expected: PASS

**Step 5: Update barrel export**

```typescript
// packages/core/src/index.ts
export * from "./types.js";
export * from "./db/index.js";
export * from "./validation.js";
```

**Step 6: Commit**

```bash
git add packages/core/src/validation.ts packages/core/src/validation.test.ts packages/core/src/index.ts
git commit -m "feat(core): add input validation utilities"
```

---

## Task 5: Board Service

**Files:**
- Create: `packages/core/src/services/board.ts`
- Create: `packages/core/src/services/board.test.ts`
- Create: `packages/core/src/services/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/services/board.test.ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { BoardService } from "./board.js";
import { createDb, initializeSchema, type DB } from "../db/index.js";
import { DEFAULT_CONFIG } from "../types.js";
import { unlinkSync, existsSync } from "node:fs";

const TEST_DB = ".kaban-test/board.db";

describe("BoardService", () => {
  let db: DB;
  let service: BoardService;

  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    db = createDb(TEST_DB);
    initializeSchema(db);
    service = new BoardService(db);
  });

  afterEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    if (existsSync(TEST_DB + "-wal")) unlinkSync(TEST_DB + "-wal");
    if (existsSync(TEST_DB + "-shm")) unlinkSync(TEST_DB + "-shm");
  });

  test("initializeBoard creates board and columns", () => {
    const board = service.initializeBoard(DEFAULT_CONFIG);

    expect(board.name).toBe("Kaban Board");
    expect(board.id).toBeDefined();

    const columns = service.getColumns();
    expect(columns).toHaveLength(5);
    expect(columns[0].id).toBe("backlog");
    expect(columns[4].isTerminal).toBe(true);
  });

  test("getBoard returns board or null", () => {
    expect(service.getBoard()).toBeNull();

    service.initializeBoard(DEFAULT_CONFIG);
    const board = service.getBoard();

    expect(board).not.toBeNull();
    expect(board?.name).toBe("Kaban Board");
  });

  test("getColumn returns column by ID", () => {
    service.initializeBoard(DEFAULT_CONFIG);

    const column = service.getColumn("in_progress");
    expect(column).not.toBeNull();
    expect(column?.wipLimit).toBe(3);

    expect(service.getColumn("nonexistent")).toBeNull();
  });

  test("getTerminalColumn returns done column", () => {
    service.initializeBoard(DEFAULT_CONFIG);

    const terminal = service.getTerminalColumn();
    expect(terminal).not.toBeNull();
    expect(terminal?.id).toBe("done");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && bun test services/board.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// packages/core/src/services/board.ts
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { type DB, boards, columns } from "../db/index.js";
import type { Board, Column, Config } from "../types.js";

export class BoardService {
  constructor(private db: DB) {}

  initializeBoard(config: Config): Board {
    const now = new Date();
    const boardId = ulid();

    this.db.insert(boards).values({
      id: boardId,
      name: config.board.name,
      createdAt: now,
      updatedAt: now,
    }).run();

    for (let i = 0; i < config.columns.length; i++) {
      const col = config.columns[i];
      this.db.insert(columns).values({
        id: col.id,
        boardId,
        name: col.name,
        position: i,
        wipLimit: col.wipLimit ?? null,
        isTerminal: col.isTerminal ?? false,
      }).run();
    }

    return {
      id: boardId,
      name: config.board.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  getBoard(): Board | null {
    const row = this.db.select().from(boards).limit(1).get();
    return row ?? null;
  }

  getColumns(): Column[] {
    return this.db
      .select()
      .from(columns)
      .orderBy(columns.position)
      .all();
  }

  getColumn(id: string): Column | null {
    const row = this.db
      .select()
      .from(columns)
      .where(eq(columns.id, id))
      .get();
    return row ?? null;
  }

  getTerminalColumn(): Column | null {
    const row = this.db
      .select()
      .from(columns)
      .where(eq(columns.isTerminal, true))
      .get();
    return row ?? null;
  }

  getTaskCountInColumn(columnId: string): number {
    const result = this.db
      .select()
      .from(columns)
      .where(eq(columns.id, columnId))
      .get();
    return result ? 0 : 0; // Will be implemented properly in TaskService
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && bun test services/board.test.ts`
Expected: PASS

**Step 5: Create services barrel export**

```typescript
// packages/core/src/services/index.ts
export * from "./board.js";
```

**Step 6: Update main barrel export**

```typescript
// packages/core/src/index.ts
export * from "./types.js";
export * from "./db/index.js";
export * from "./validation.js";
export * from "./services/index.js";
```

**Step 7: Commit**

```bash
git add packages/core/src/services/
git add packages/core/src/index.ts
git commit -m "feat(core): add BoardService for board management"
```

---

## Task 6: Task Service - Basic CRUD

**Files:**
- Create: `packages/core/src/services/task.ts`
- Create: `packages/core/src/services/task.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/services/task.test.ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { TaskService } from "./task.js";
import { BoardService } from "./board.js";
import { createDb, initializeSchema, type DB } from "../db/index.js";
import { DEFAULT_CONFIG, KabanError, ExitCode } from "../types.js";
import { unlinkSync, existsSync, rmSync } from "node:fs";

const TEST_DIR = ".kaban-test-task";
const TEST_DB = `${TEST_DIR}/board.db`;

describe("TaskService", () => {
  let db: DB;
  let boardService: BoardService;
  let taskService: TaskService;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    db = createDb(TEST_DB);
    initializeSchema(db);
    boardService = new BoardService(db);
    taskService = new TaskService(db, boardService);
    boardService.initializeBoard(DEFAULT_CONFIG);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe("addTask", () => {
    test("creates task with defaults", () => {
      const task = taskService.addTask({ title: "Test task" });

      expect(task.title).toBe("Test task");
      expect(task.columnId).toBe("todo");
      expect(task.createdBy).toBe("user");
      expect(task.version).toBe(1);
      expect(task.id).toHaveLength(26);
    });

    test("creates task with custom column and agent", () => {
      const task = taskService.addTask({
        title: "Agent task",
        columnId: "backlog",
        agent: "claude",
      });

      expect(task.columnId).toBe("backlog");
      expect(task.createdBy).toBe("claude");
    });

    test("throws on invalid column", () => {
      expect(() =>
        taskService.addTask({ title: "Test", columnId: "invalid" }),
      ).toThrow(KabanError);
    });
  });

  describe("getTask", () => {
    test("returns task by ID", () => {
      const created = taskService.addTask({ title: "Test" });
      const found = taskService.getTask(created.id);

      expect(found).not.toBeNull();
      expect(found?.title).toBe("Test");
    });

    test("returns null for nonexistent task", () => {
      expect(taskService.getTask("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBeNull();
    });
  });

  describe("listTasks", () => {
    test("returns all tasks", () => {
      taskService.addTask({ title: "Task 1" });
      taskService.addTask({ title: "Task 2" });

      const tasks = taskService.listTasks();
      expect(tasks).toHaveLength(2);
    });

    test("filters by column", () => {
      taskService.addTask({ title: "Todo", columnId: "todo" });
      taskService.addTask({ title: "Backlog", columnId: "backlog" });

      const tasks = taskService.listTasks({ columnId: "todo" });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Todo");
    });

    test("filters by agent", () => {
      taskService.addTask({ title: "User task", agent: "user" });
      taskService.addTask({ title: "Claude task", agent: "claude" });

      const tasks = taskService.listTasks({ agent: "claude" });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Claude task");
    });
  });

  describe("deleteTask", () => {
    test("deletes task", () => {
      const task = taskService.addTask({ title: "To delete" });
      taskService.deleteTask(task.id);

      expect(taskService.getTask(task.id)).toBeNull();
    });

    test("throws on nonexistent task", () => {
      expect(() =>
        taskService.deleteTask("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
      ).toThrow(KabanError);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && bun test services/task.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// packages/core/src/services/task.ts
import { eq, and, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { type DB, tasks } from "../db/index.js";
import type { Task } from "../types.js";
import { KabanError, ExitCode } from "../types.js";
import { validateTitle, validateAgentName, validateColumnId } from "../validation.js";
import type { BoardService } from "./board.js";

export interface AddTaskInput {
  title: string;
  description?: string;
  columnId?: string;
  agent?: string;
  dependsOn?: string[];
  files?: string[];
  labels?: string[];
}

export interface ListTasksFilter {
  columnId?: string;
  agent?: string;
  blocked?: boolean;
}

export class TaskService {
  constructor(
    private db: DB,
    private boardService: BoardService,
  ) {}

  addTask(input: AddTaskInput): Task {
    const title = validateTitle(input.title);
    const agent = input.agent ? validateAgentName(input.agent) : "user";
    const columnId = input.columnId
      ? validateColumnId(input.columnId)
      : "todo";

    const column = this.boardService.getColumn(columnId);
    if (!column) {
      throw new KabanError(
        `Column '${columnId}' does not exist`,
        ExitCode.VALIDATION,
      );
    }

    const now = new Date();
    const id = ulid();

    const maxPosition = this.db
      .select({ max: sql<number>`COALESCE(MAX(position), -1)` })
      .from(tasks)
      .where(eq(tasks.columnId, columnId))
      .get();

    const position = (maxPosition?.max ?? -1) + 1;

    this.db.insert(tasks).values({
      id,
      title,
      description: input.description ?? null,
      columnId,
      position,
      createdBy: agent,
      assignedTo: null,
      parentId: null,
      dependsOn: input.dependsOn ?? [],
      files: input.files ?? [],
      labels: input.labels ?? [],
      blockedReason: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
    }).run();

    return this.getTask(id)!;
  }

  getTask(id: string): Task | null {
    const row = this.db.select().from(tasks).where(eq(tasks.id, id)).get();
    return row ?? null;
  }

  listTasks(filter?: ListTasksFilter): Task[] {
    let query = this.db.select().from(tasks);

    const conditions = [];
    if (filter?.columnId) {
      conditions.push(eq(tasks.columnId, filter.columnId));
    }
    if (filter?.agent) {
      conditions.push(eq(tasks.createdBy, filter.agent));
    }
    if (filter?.blocked === true) {
      conditions.push(sql`${tasks.blockedReason} IS NOT NULL`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    return query.orderBy(tasks.columnId, tasks.position).all();
  }

  deleteTask(id: string): void {
    const task = this.getTask(id);
    if (!task) {
      throw new KabanError(`Task '${id}' not found`, ExitCode.NOT_FOUND);
    }

    this.db.delete(tasks).where(eq(tasks.id, id)).run();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && bun test services/task.test.ts`
Expected: PASS

**Step 5: Update services barrel export**

```typescript
// packages/core/src/services/index.ts
export * from "./board.js";
export * from "./task.js";
```

**Step 6: Commit**

```bash
git add packages/core/src/services/task.ts packages/core/src/services/task.test.ts packages/core/src/services/index.ts
git commit -m "feat(core): add TaskService with basic CRUD"
```

---

## Task 7: Task Service - Move with WIP Limit

**Files:**
- Modify: `packages/core/src/services/task.ts`
- Modify: `packages/core/src/services/task.test.ts`

**Step 1: Write the failing test**

Add to `packages/core/src/services/task.test.ts`:

```typescript
describe("moveTask", () => {
  test("moves task to new column", () => {
    const task = taskService.addTask({ title: "Movable", columnId: "todo" });
    const moved = taskService.moveTask(task.id, "in_progress");

    expect(moved.columnId).toBe("in_progress");
    expect(moved.version).toBe(2);
  });

  test("rejects move when WIP limit exceeded", () => {
    // in_progress has wipLimit: 3
    taskService.addTask({ title: "Task 1", columnId: "in_progress" });
    taskService.addTask({ title: "Task 2", columnId: "in_progress" });
    taskService.addTask({ title: "Task 3", columnId: "in_progress" });

    const task = taskService.addTask({ title: "Task 4", columnId: "todo" });

    expect(() => taskService.moveTask(task.id, "in_progress")).toThrow(
      /WIP limit/,
    );
  });

  test("allows move with --force when WIP limit exceeded", () => {
    taskService.addTask({ title: "Task 1", columnId: "in_progress" });
    taskService.addTask({ title: "Task 2", columnId: "in_progress" });
    taskService.addTask({ title: "Task 3", columnId: "in_progress" });

    const task = taskService.addTask({ title: "Task 4", columnId: "todo" });
    const moved = taskService.moveTask(task.id, "in_progress", { force: true });

    expect(moved.columnId).toBe("in_progress");
  });

  test("sets completedAt when moving to terminal column", () => {
    const task = taskService.addTask({ title: "To complete" });
    const moved = taskService.moveTask(task.id, "done");

    expect(moved.completedAt).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && bun test services/task.test.ts`
Expected: FAIL - moveTask is not a function

**Step 3: Add moveTask implementation**

Add to `packages/core/src/services/task.ts`:

```typescript
export interface MoveTaskOptions {
  force?: boolean;
}

// Add to TaskService class:
moveTask(id: string, columnId: string, options?: MoveTaskOptions): Task {
  const task = this.getTask(id);
  if (!task) {
    throw new KabanError(`Task '${id}' not found`, ExitCode.NOT_FOUND);
  }

  validateColumnId(columnId);
  const column = this.boardService.getColumn(columnId);
  if (!column) {
    throw new KabanError(
      `Column '${columnId}' does not exist`,
      ExitCode.VALIDATION,
    );
  }

  // Check WIP limit
  if (column.wipLimit && !options?.force) {
    const count = this.getTaskCountInColumn(columnId);
    if (count >= column.wipLimit) {
      throw new KabanError(
        `Column '${column.name}' at WIP limit (${count}/${column.wipLimit}). Move a task out first.`,
        ExitCode.VALIDATION,
      );
    }
  }

  const now = new Date();
  const isTerminal = column.isTerminal;

  // Get max position in target column
  const maxPosition = this.db
    .select({ max: sql<number>`COALESCE(MAX(position), -1)` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId))
    .get();

  const newPosition = (maxPosition?.max ?? -1) + 1;

  this.db
    .update(tasks)
    .set({
      columnId,
      position: newPosition,
      version: task.version + 1,
      updatedAt: now,
      completedAt: isTerminal ? now : task.completedAt,
      startedAt: columnId === "in_progress" && !task.startedAt ? now : task.startedAt,
    })
    .where(eq(tasks.id, id))
    .run();

  return this.getTask(id)!;
}

private getTaskCountInColumn(columnId: string): number {
  const result = this.db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId))
    .get();
  return result?.count ?? 0;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && bun test services/task.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/services/task.ts packages/core/src/services/task.test.ts
git commit -m "feat(core): add moveTask with WIP limit enforcement"
```

---

## Task 8: Task Service - Optimistic Locking

**Files:**
- Modify: `packages/core/src/services/task.ts`
- Modify: `packages/core/src/services/task.test.ts`

**Step 1: Write the failing test**

Add to `packages/core/src/services/task.test.ts`:

```typescript
describe("optimistic locking", () => {
  test("rejects update with stale version", () => {
    const task = taskService.addTask({ title: "Original" });

    // Simulate another agent updating
    taskService.updateTask(task.id, { title: "Updated by other" });

    // Try to update with stale version
    expect(() =>
      taskService.updateTask(task.id, { title: "My update" }, task.version),
    ).toThrow(/modified by another agent/);
  });

  test("succeeds with correct version", () => {
    const task = taskService.addTask({ title: "Original" });
    const updated = taskService.updateTask(
      task.id,
      { title: "Updated" },
      task.version,
    );

    expect(updated.title).toBe("Updated");
    expect(updated.version).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && bun test services/task.test.ts`
Expected: FAIL - updateTask is not a function

**Step 3: Add updateTask implementation**

Add to `packages/core/src/services/task.ts`:

```typescript
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedTo?: string | null;
  files?: string[];
  labels?: string[];
}

// Add to TaskService class:
updateTask(id: string, input: UpdateTaskInput, expectedVersion?: number): Task {
  const task = this.getTask(id);
  if (!task) {
    throw new KabanError(`Task '${id}' not found`, ExitCode.NOT_FOUND);
  }

  // Optimistic locking check
  if (expectedVersion !== undefined && task.version !== expectedVersion) {
    throw new KabanError(
      `Task modified by another agent, re-read required. Current version: ${task.version}`,
      ExitCode.CONFLICT,
    );
  }

  const updates: Record<string, unknown> = {
    version: task.version + 1,
    updatedAt: new Date(),
  };

  if (input.title !== undefined) {
    updates.title = validateTitle(input.title);
  }
  if (input.description !== undefined) {
    updates.description = input.description;
  }
  if (input.assignedTo !== undefined) {
    updates.assignedTo = input.assignedTo
      ? validateAgentName(input.assignedTo)
      : null;
  }
  if (input.files !== undefined) {
    updates.files = input.files;
  }
  if (input.labels !== undefined) {
    updates.labels = input.labels;
  }

  const result = this.db
    .update(tasks)
    .set(updates)
    .where(
      expectedVersion !== undefined
        ? and(eq(tasks.id, id), eq(tasks.version, expectedVersion))
        : eq(tasks.id, id),
    )
    .run();

  if (expectedVersion !== undefined && result.changes === 0) {
    throw new KabanError(
      `Task modified by another agent, re-read required`,
      ExitCode.CONFLICT,
    );
  }

  return this.getTask(id)!;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && bun test services/task.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/services/task.ts packages/core/src/services/task.test.ts
git commit -m "feat(core): add optimistic locking to updateTask"
```

---

## Task 9: CLI Setup with Init Command

**Files:**
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/init.ts`

**Step 1: Create CLI entry point**

```typescript
// packages/cli/src/index.ts
#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";

const program = new Command();

program
  .name("kaban")
  .description("Terminal Kanban for AI Code Agents")
  .version("0.1.0");

program.addCommand(initCommand);

program.parse();
```

**Step 2: Create init command**

```typescript
// packages/cli/src/commands/init.ts
import { Command } from "commander";
import { join } from "node:path";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import {
  createDb,
  initializeSchema,
  BoardService,
  DEFAULT_CONFIG,
  type Config,
} from "@kaban/core";

export const initCommand = new Command("init")
  .description("Initialize a new Kaban board in the current directory")
  .option("-n, --name <name>", "Board name", "Kaban Board")
  .action((options) => {
    const kabanDir = join(process.cwd(), ".kaban");
    const dbPath = join(kabanDir, "board.db");
    const configPath = join(kabanDir, "config.json");

    if (existsSync(dbPath)) {
      console.error("Error: Board already exists in this directory");
      process.exit(1);
    }

    // Create directory
    mkdirSync(kabanDir, { recursive: true });

    // Create config
    const config: Config = {
      ...DEFAULT_CONFIG,
      board: { name: options.name },
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Initialize database
    const db = createDb(dbPath);
    initializeSchema(db);
    const boardService = new BoardService(db);
    boardService.initializeBoard(config);

    console.log(`✓ Initialized Kaban board: ${options.name}`);
    console.log(`  Database: ${dbPath}`);
    console.log(`  Config: ${configPath}`);
  });
```

**Step 3: Build and test manually**

Run: `cd packages/cli && bun run build`
Run: `cd /tmp && mkdir kaban-test && cd kaban-test && node ~/path/to/packages/cli/dist/index.js init`
Expected: Board initialized successfully

**Step 4: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): add init command"
```

---

## Task 10: CLI Add Command

**Files:**
- Create: `packages/cli/src/commands/add.ts`
- Create: `packages/cli/src/lib/context.ts`
- Modify: `packages/cli/src/index.ts`

**Step 1: Create context helper**

```typescript
// packages/cli/src/lib/context.ts
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import {
  createDb,
  BoardService,
  TaskService,
  type Config,
  type DB,
} from "@kaban/core";

export interface KabanContext {
  db: DB;
  config: Config;
  boardService: BoardService;
  taskService: TaskService;
}

export function getContext(): KabanContext {
  const kabanDir = join(process.cwd(), ".kaban");
  const dbPath = join(kabanDir, "board.db");
  const configPath = join(kabanDir, "config.json");

  if (!existsSync(dbPath)) {
    console.error("Error: No board found. Run 'kaban init' first");
    process.exit(1);
  }

  const db = createDb(dbPath);
  const config: Config = JSON.parse(readFileSync(configPath, "utf-8"));
  const boardService = new BoardService(db);
  const taskService = new TaskService(db, boardService);

  return { db, config, boardService, taskService };
}

export function getAgent(): string {
  return process.env.KABAN_AGENT ?? "user";
}
```

**Step 2: Create add command**

```typescript
// packages/cli/src/commands/add.ts
import { Command } from "commander";
import { getContext, getAgent } from "../lib/context.js";
import { KabanError } from "@kaban/core";

export const addCommand = new Command("add")
  .description("Add a new task")
  .argument("<title>", "Task title")
  .option("-c, --column <column>", "Column to add task to")
  .option("-a, --agent <agent>", "Agent creating the task")
  .option("-d, --depends-on <ids>", "Comma-separated task IDs this depends on")
  .action((title, options) => {
    try {
      const { taskService, config } = getContext();
      const agent = options.agent ?? getAgent();
      const columnId = options.column ?? config.defaults.column;
      const dependsOn = options.dependsOn
        ? options.dependsOn.split(",").map((s: string) => s.trim())
        : [];

      const task = taskService.addTask({
        title,
        columnId,
        agent,
        dependsOn,
      });

      console.log(`✓ Created task [${task.id.slice(0, 8)}] "${task.title}"`);
      console.log(`  Column: ${task.columnId}`);
      console.log(`  Agent: ${task.createdBy}`);
    } catch (error) {
      if (error instanceof KabanError) {
        console.error(`Error: ${error.message}`);
        process.exit(error.code);
      }
      throw error;
    }
  });
```

**Step 3: Update CLI entry point**

```typescript
// packages/cli/src/index.ts
#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";

const program = new Command();

program
  .name("kaban")
  .description("Terminal Kanban for AI Code Agents")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(addCommand);

program.parse();
```

**Step 4: Build and test**

Run: `cd packages/cli && bun run build`
Run: `cd /tmp/kaban-test && node ~/path/to/packages/cli/dist/index.js add "Test task"`
Expected: Task created

**Step 5: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): add 'add' command for creating tasks"
```

---

## Task 11: CLI List Command

**Files:**
- Create: `packages/cli/src/commands/list.ts`
- Modify: `packages/cli/src/index.ts`

**Step 1: Create list command**

```typescript
// packages/cli/src/commands/list.ts
import { Command } from "commander";
import { getContext } from "../lib/context.js";
import { KabanError } from "@kaban/core";

export const listCommand = new Command("list")
  .description("List tasks")
  .option("-c, --column <column>", "Filter by column")
  .option("-a, --agent <agent>", "Filter by agent")
  .option("-b, --blocked", "Show only blocked tasks")
  .option("-j, --json", "Output as JSON")
  .action((options) => {
    try {
      const { taskService, boardService } = getContext();

      const tasks = taskService.listTasks({
        columnId: options.column,
        agent: options.agent,
        blocked: options.blocked,
      });

      if (options.json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      if (tasks.length === 0) {
        console.log("No tasks found");
        return;
      }

      const columns = boardService.getColumns();
      const columnMap = new Map(columns.map((c) => [c.id, c]));

      for (const task of tasks) {
        const column = columnMap.get(task.columnId);
        const blocked = task.blockedReason ? " ⚠️ blocked" : "";
        const agent = task.createdBy !== "user" ? ` @${task.createdBy}` : "";

        console.log(
          `[${task.id.slice(0, 8)}] ${task.title}${agent}${blocked}`,
        );
        console.log(`         ${column?.name ?? task.columnId}`);
      }
    } catch (error) {
      if (error instanceof KabanError) {
        console.error(`Error: ${error.message}`);
        process.exit(error.code);
      }
      throw error;
    }
  });
```

**Step 2: Update CLI entry point**

```typescript
// packages/cli/src/index.ts
#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("kaban")
  .description("Terminal Kanban for AI Code Agents")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);

program.parse();
```

**Step 3: Build and test**

Run: `cd packages/cli && bun run build`
Run: `cd /tmp/kaban-test && node ~/path/to/packages/cli/dist/index.js list`
Expected: Lists tasks

**Step 4: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): add 'list' command with filters"
```

---

## Task 12: CLI Move and Done Commands

**Files:**
- Create: `packages/cli/src/commands/move.ts`
- Create: `packages/cli/src/commands/done.ts`
- Modify: `packages/cli/src/index.ts`

**Step 1: Create move command**

```typescript
// packages/cli/src/commands/move.ts
import { Command } from "commander";
import { getContext } from "../lib/context.js";
import { KabanError } from "@kaban/core";

export const moveCommand = new Command("move")
  .description("Move a task to a different column")
  .argument("<id>", "Task ID (can be partial)")
  .argument("[column]", "Target column")
  .option("-n, --next", "Move to next column")
  .option("-f, --force", "Force move even if WIP limit exceeded")
  .action((id, column, options) => {
    try {
      const { taskService, boardService } = getContext();

      // Find task by partial ID
      const tasks = taskService.listTasks();
      const task = tasks.find((t) => t.id.startsWith(id));

      if (!task) {
        console.error(`Error: Task '${id}' not found`);
        process.exit(2);
      }

      let targetColumn = column;

      if (options.next) {
        const columns = boardService.getColumns();
        const currentIdx = columns.findIndex((c) => c.id === task.columnId);
        if (currentIdx < columns.length - 1) {
          targetColumn = columns[currentIdx + 1].id;
        } else {
          console.error("Error: Task is already in the last column");
          process.exit(4);
        }
      }

      if (!targetColumn) {
        console.error("Error: Specify a column or use --next");
        process.exit(4);
      }

      const moved = taskService.moveTask(task.id, targetColumn, {
        force: options.force,
      });

      const col = boardService.getColumn(moved.columnId);
      console.log(`✓ Moved [${moved.id.slice(0, 8)}] to ${col?.name}`);
    } catch (error) {
      if (error instanceof KabanError) {
        console.error(`Error: ${error.message}`);
        process.exit(error.code);
      }
      throw error;
    }
  });
```

**Step 2: Create done command**

```typescript
// packages/cli/src/commands/done.ts
import { Command } from "commander";
import { getContext } from "../lib/context.js";
import { KabanError } from "@kaban/core";

export const doneCommand = new Command("done")
  .description("Mark a task as done")
  .argument("<id>", "Task ID (can be partial)")
  .action((id) => {
    try {
      const { taskService, boardService } = getContext();

      // Find task by partial ID
      const tasks = taskService.listTasks();
      const task = tasks.find((t) => t.id.startsWith(id));

      if (!task) {
        console.error(`Error: Task '${id}' not found`);
        process.exit(2);
      }

      const terminal = boardService.getTerminalColumn();
      if (!terminal) {
        console.error("Error: No terminal column configured");
        process.exit(1);
      }

      const moved = taskService.moveTask(task.id, terminal.id);
      console.log(`✓ Completed [${moved.id.slice(0, 8)}] "${moved.title}"`);
    } catch (error) {
      if (error instanceof KabanError) {
        console.error(`Error: ${error.message}`);
        process.exit(error.code);
      }
      throw error;
    }
  });
```

**Step 3: Update CLI entry point**

```typescript
// packages/cli/src/index.ts
#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { moveCommand } from "./commands/move.js";
import { doneCommand } from "./commands/done.js";

const program = new Command();

program
  .name("kaban")
  .description("Terminal Kanban for AI Code Agents")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);
program.addCommand(moveCommand);
program.addCommand(doneCommand);

program.parse();
```

**Step 4: Build and test**

Run: `cd packages/cli && bun run build`
Run: `cd /tmp/kaban-test && node ~/path/to/packages/cli/dist/index.js move <id> in_progress`
Expected: Task moved

**Step 5: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): add 'move' and 'done' commands"
```

---

## Task 13: CLI Status Command

**Files:**
- Create: `packages/cli/src/commands/status.ts`
- Modify: `packages/cli/src/index.ts`

**Step 1: Create status command**

```typescript
// packages/cli/src/commands/status.ts
import { Command } from "commander";
import { getContext } from "../lib/context.js";
import { KabanError } from "@kaban/core";

export const statusCommand = new Command("status")
  .description("Show board status summary")
  .action(() => {
    try {
      const { taskService, boardService } = getContext();
      const board = boardService.getBoard();
      const columns = boardService.getColumns();
      const tasks = taskService.listTasks();

      console.log(`\n📋 ${board?.name ?? "Kaban Board"}\n`);

      for (const column of columns) {
        const columnTasks = tasks.filter((t) => t.columnId === column.id);
        const count = columnTasks.length;
        const limit = column.wipLimit ? `/${column.wipLimit}` : "";
        const terminal = column.isTerminal ? " ✓" : "";

        console.log(`  ${column.name}: ${count}${limit}${terminal}`);
      }

      const blocked = tasks.filter((t) => t.blockedReason).length;
      if (blocked > 0) {
        console.log(`\n  ⚠️  ${blocked} blocked task(s)`);
      }

      console.log();
    } catch (error) {
      if (error instanceof KabanError) {
        console.error(`Error: ${error.message}`);
        process.exit(error.code);
      }
      throw error;
    }
  });
```

**Step 2: Update CLI entry point**

Add `statusCommand` to imports and `program.addCommand(statusCommand);`

**Step 3: Build and test**

Run: `cd packages/cli && bun run build`
Run: `cd /tmp/kaban-test && node ~/path/to/packages/cli/dist/index.js status`

**Step 4: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): add 'status' command for board overview"
```

---

## Task 14: Final Integration Test

**Files:**
- Create: `packages/cli/src/cli.test.ts`

**Step 1: Write integration test**

```typescript
// packages/cli/src/cli.test.ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "/tmp/kaban-cli-test";
const CLI = join(import.meta.dir, "../dist/index.js");

function run(cmd: string): string {
  return execSync(`node ${CLI} ${cmd}`, {
    cwd: TEST_DIR,
    encoding: "utf-8",
  });
}

describe("CLI Integration", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  test("full workflow: init -> add -> list -> move -> done", () => {
    // Init
    const initOutput = run("init --name 'Test Board'");
    expect(initOutput).toContain("Initialized");

    // Add tasks
    run('add "Task 1"');
    run('add "Task 2" --column backlog');
    run('add "Task 3" --agent claude');

    // List
    const listOutput = run("list");
    expect(listOutput).toContain("Task 1");
    expect(listOutput).toContain("Task 2");
    expect(listOutput).toContain("Task 3");

    // List with filter
    const agentList = run("list --agent claude");
    expect(agentList).toContain("Task 3");
    expect(agentList).not.toContain("Task 1");

    // JSON output
    const jsonOutput = run("list --json");
    const tasks = JSON.parse(jsonOutput);
    expect(tasks).toHaveLength(3);

    // Status
    const statusOutput = run("status");
    expect(statusOutput).toContain("Test Board");

    // Move (get first task ID from JSON)
    const taskId = tasks[0].id.slice(0, 8);
    run(`move ${taskId} in_progress`);

    const afterMove = run("list --json");
    const movedTask = JSON.parse(afterMove).find((t: { id: string }) =>
      t.id.startsWith(taskId),
    );
    expect(movedTask.columnId).toBe("in_progress");

    // Done
    run(`done ${taskId}`);
    const afterDone = run("list --json");
    const doneTask = JSON.parse(afterDone).find((t: { id: string }) =>
      t.id.startsWith(taskId),
    );
    expect(doneTask.columnId).toBe("done");
    expect(doneTask.completedAt).not.toBeNull();
  });
});
```

**Step 2: Build CLI first**

Run: `cd packages/cli && bun run build`

**Step 3: Run integration test**

Run: `cd packages/cli && bun test cli.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/cli/src/cli.test.ts
git commit -m "test(cli): add integration test for full workflow"
```

---

## Summary

Phase 1 complete with:

- **@kaban/core**: Types, DB schema, validation, BoardService, TaskService
- **@kaban/cli**: init, add, list, move, done, status commands
- **Tests**: Unit tests for core, integration test for CLI
- **Features**: Optimistic locking, WIP limits, partial ID matching

**Next Phase**: TUI with OpenTUI
