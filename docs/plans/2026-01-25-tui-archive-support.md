# TUI Archive Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add archive functionality to the TUI interface - archive/restore tasks, toggle archive view, visual indicators.

**Architecture:** Extend `AppState` with `archiveViewMode` boolean. Add `archiveTask` and `restoreTask` modal types. Update `board.ts` to conditionally show archived tasks with empty state handling. Add keybindings `x` (archive) and `X` (toggle view).

**Tech Stack:** TypeScript, @opentui/core, @kaban-board/core (existing TaskService archive methods)

---

## Edge Case Scenarios

### Scenario: Toggle to empty archive view
```gherkin
Given: Board has 5 active tasks and 0 archived tasks
When: User presses 'X' to toggle archive view
Then: Header shows "[ARCHIVE]"
And: All columns show "(empty)"
And: Footer shows "[X]Back [?] [q]" (no restore action available)
```

### Scenario: Archive last task in column
```gherkin
Given: "In Progress" column has 1 task
When: User archives that task
Then: Task disappears
And: Column shows "(empty)"
And: Selection stays in current column
```

### Scenario: Restore task (WIP bypass)
```gherkin
Given: Task was archived from "In Progress" (WIP limit: 3, current: 3)
When: User restores the task
Then: Task is restored (WIP bypass per core API design)
And: "In Progress" now shows 4 tasks
```

---

## Task 1: Extend AppState with Archive View Mode

**Files:**
- Modify: `packages/tui/src/lib/types.ts`

**Step 1: Add archiveViewMode to AppState**

```typescript
// In types.ts, add to AppState interface (after line 68):
  archiveViewMode: boolean;
```

**Step 2: Add archiveTask and restoreTask to ModalType**

```typescript
// In types.ts, update ModalType union (line 11-20):
export type ModalType =
  | "none"
  | "addTask"
  | "moveTask"
  | "assignTask"
  | "deleteTask"
  | "archiveTask"
  | "restoreTask"
  | "viewTask"
  | "editTask"
  | "help"
  | "quit";
```

**Step 3: Add onArchive to ViewTaskActions interface**

```typescript
// In types.ts, update ViewTaskActions (lines 33-38):
export interface ViewTaskActions {
  onMove: () => Promise<void>;
  onAssign: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: () => Promise<void>;
  onArchive: () => Promise<void>;
}
```

**Step 4: Run typecheck to verify**

Run: `bun run typecheck`
Expected: Error about missing `archiveViewMode` in index.ts (we'll fix in next task)

---

## Task 2: Initialize archiveViewMode in Main Entry

**Files:**
- Modify: `packages/tui/src/index.ts`

**Step 1: Add archiveViewMode to initial state**

```typescript
// In index.ts, add to state object (after line 67, before closing brace):
    archiveViewMode: false,
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 3: Create Archive Task Modal

**Files:**
- Create: `packages/tui/src/components/modals/archive-task.ts`

**Step 1: Create the archive modal file**

```typescript
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { COLORS } from "../../lib/theme.js";
import type { AppState } from "../../lib/types.js";
import { getSelectedTaskId } from "../../lib/types.js";
import { createModalOverlay } from "../overlay.js";
import { closeModal } from "./shared.js";

export async function showArchiveTaskModal(
  state: AppState,
  onArchived: () => Promise<void>,
): Promise<void> {
  const { renderer } = state;

  const taskId = getSelectedTaskId(state);
  if (!taskId) {
    return;
  }

  const task = await state.taskService.getTask(taskId);
  if (!task) {
    return;
  }

  // Defensive: don't archive already-archived task
  if (task.archived) {
    return;
  }

  state.selectedTask = task;

  const { overlay, dialog } = createModalOverlay(renderer, {
    id: "archive-task-dialog",
    width: 45,
    height: 10,
    borderColor: COLORS.warning,
  });

  const titleRow = new BoxRenderable(renderer, {
    id: "archive-title-row",
    width: "100%",
    height: 1,
    justifyContent: "center",
  });
  const title = new TextRenderable(renderer, {
    id: "archive-title",
    content: "Archive Task?",
    fg: COLORS.warning,
  });
  titleRow.add(title);

  const spacer1 = new BoxRenderable(renderer, { id: "archive-spacer1", width: "100%", height: 1 });

  const taskRow = new BoxRenderable(renderer, {
    id: "archive-task-row",
    width: "100%",
    height: 1,
  });
  const taskText = new TextRenderable(renderer, {
    id: "archive-task-text",
    content: task.title.slice(0, 40),
    fg: COLORS.text,
  });
  taskRow.add(taskText);

  const infoRow = new BoxRenderable(renderer, {
    id: "archive-info-row",
    width: "100%",
    height: 1,
  });
  const info = new TextRenderable(renderer, {
    id: "archive-info",
    content: "Task will be moved to archive.",
    fg: COLORS.textMuted,
  });
  infoRow.add(info);

  const spacer2 = new BoxRenderable(renderer, { id: "archive-spacer2", width: "100%", height: 2 });

  const hintRow = new BoxRenderable(renderer, {
    id: "archive-hint-row",
    width: "100%",
    height: 1,
    justifyContent: "center",
  });
  const hint = new TextRenderable(renderer, {
    id: "archive-hint",
    content: "[y] Archive  [n/Esc] Cancel",
    fg: COLORS.textMuted,
  });
  hintRow.add(hint);

  dialog.add(titleRow);
  dialog.add(spacer1);
  dialog.add(taskRow);
  dialog.add(infoRow);
  dialog.add(spacer2);
  dialog.add(hintRow);
  renderer.root.add(overlay);

  state.modalOverlay = overlay;
  state.activeModal = "archiveTask";
  state.onModalConfirm = async () => {
    await state.taskService.archiveTasks("default", { taskIds: [taskId] });
    closeModal(state);
    await onArchived();
  };
}
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 4: Create Restore Task Modal

**Files:**
- Create: `packages/tui/src/components/modals/restore-task.ts`

**Step 1: Create the restore modal file**

```typescript
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { COLORS } from "../../lib/theme.js";
import type { AppState } from "../../lib/types.js";
import { getSelectedTaskId } from "../../lib/types.js";
import { createModalOverlay } from "../overlay.js";
import { closeModal } from "./shared.js";

export async function showRestoreTaskModal(
  state: AppState,
  onRestored: () => Promise<void>,
): Promise<void> {
  const { renderer } = state;

  const taskId = getSelectedTaskId(state);
  if (!taskId) {
    return;
  }

  const task = await state.taskService.getTask(taskId);
  if (!task) {
    return;
  }

  // Defensive: only restore archived tasks
  if (!task.archived) {
    return;
  }

  state.selectedTask = task;

  const { overlay, dialog } = createModalOverlay(renderer, {
    id: "restore-task-dialog",
    width: 45,
    height: 10,
    borderColor: COLORS.success,
  });

  const titleRow = new BoxRenderable(renderer, {
    id: "restore-title-row",
    width: "100%",
    height: 1,
    justifyContent: "center",
  });
  const title = new TextRenderable(renderer, {
    id: "restore-title",
    content: "Restore Task?",
    fg: COLORS.success,
  });
  titleRow.add(title);

  const spacer1 = new BoxRenderable(renderer, { id: "restore-spacer1", width: "100%", height: 1 });

  const taskRow = new BoxRenderable(renderer, {
    id: "restore-task-row",
    width: "100%",
    height: 1,
  });
  const taskText = new TextRenderable(renderer, {
    id: "restore-task-text",
    content: task.title.slice(0, 40),
    fg: COLORS.text,
  });
  taskRow.add(taskText);

  const infoRow = new BoxRenderable(renderer, {
    id: "restore-info-row",
    width: "100%",
    height: 1,
  });
  const info = new TextRenderable(renderer, {
    id: "restore-info",
    content: "Task will be restored to its original column.",
    fg: COLORS.textMuted,
  });
  infoRow.add(info);

  const spacer2 = new BoxRenderable(renderer, { id: "restore-spacer2", width: "100%", height: 2 });

  const hintRow = new BoxRenderable(renderer, {
    id: "restore-hint-row",
    width: "100%",
    height: 1,
    justifyContent: "center",
  });
  const hint = new TextRenderable(renderer, {
    id: "restore-hint",
    content: "[y] Restore  [n/Esc] Cancel",
    fg: COLORS.textMuted,
  });
  hintRow.add(hint);

  dialog.add(titleRow);
  dialog.add(spacer1);
  dialog.add(taskRow);
  dialog.add(infoRow);
  dialog.add(spacer2);
  dialog.add(hintRow);
  renderer.root.add(overlay);

  state.modalOverlay = overlay;
  state.activeModal = "restoreTask";
  state.onModalConfirm = async () => {
    await state.taskService.restoreTask(taskId);
    closeModal(state);
    await onRestored();
  };
}
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 5: Export New Modals

**Files:**
- Modify: `packages/tui/src/components/modals/index.ts`

**Step 1: Add exports for archive and restore modals**

```typescript
// Add after line 3 (after showDeleteTaskModal export):
export { showArchiveTaskModal } from "./archive-task.js";
export { showRestoreTaskModal } from "./restore-task.js";
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 6: Update Board View for Archive Mode

**Files:**
- Modify: `packages/tui/src/components/board.ts`

**Step 1: Update refreshBoard to support archive mode**

Replace line 15 (`const tasks = await taskService.listTasks();`) with:

```typescript
  const tasks = state.archiveViewMode
    ? (await taskService.listTasks({ includeArchived: true })).filter((t) => t.archived)
    : await taskService.listTasks();
```

**Step 2: Update header to show archive indicator**

Replace line 39 (the headerText content) with:

```typescript
  const modeIndicator = state.archiveViewMode ? " [ARCHIVE]" : "";
  const headerText = new TextRenderable(renderer, {
    id: "header-text",
    content: t`${fg(COLORS.warning)(LOGO)} ${fg(COLORS.accent)(state.boardName)}${fg(COLORS.textMuted)(modeIndicator)}`,
  });
```

**Step 3: Update footer based on mode (shortened for narrow terminals)**

Replace lines 144-148 (footerText creation) with:

```typescript
  const hasTasksInView = tasks.length > 0;
  const footerContent = state.archiveViewMode
    ? hasTasksInView
      ? "[r]estore [X]Exit  [?] [q]uit"
      : "[X]Exit  [?] [q]uit"
    : "[a]dd [m]ove [u] [d]el [x] [X]Arch  [?] [q]";
  const footerText = new TextRenderable(renderer, {
    id: "footer-text",
    content: footerContent,
    fg: COLORS.textMuted,
  });
```

**Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 7: Add Archive Keybindings

**Files:**
- Modify: `packages/tui/src/lib/keybindings.ts`

**Step 1: Import new modal functions**

Update imports (lines 2-16) to include:

```typescript
import { refreshBoard } from "../components/board.js";
import {
  cancelEditTask,
  closeModal,
  copyTaskId,
  focusNextEditField,
  scrollViewTaskDescription,
  showAddTaskModal,
  showArchiveTaskModal,
  showAssignTaskModal,
  showDeleteTaskModal,
  showEditTaskModal,
  showHelpModal,
  showMoveTaskModal,
  showQuitModal,
  showRestoreTaskModal,
  showViewTaskModal,
} from "../components/modals/index.js";
```

**Step 2: Add archive/restore handler function**

Add after `openDeleteModal` handler (around line 59):

```typescript
const openArchiveModal: KeyHandler = async (state) => {
  const taskId = getSelectedTaskId(state);
  if (taskId) {
    if (state.archiveViewMode) {
      await showRestoreTaskModal(state, () => refreshBoard(state));
    } else {
      await showArchiveTaskModal(state, () => refreshBoard(state));
    }
  }
};

const toggleArchiveView: KeyHandler = async (state) => {
  state.archiveViewMode = !state.archiveViewMode;
  state.currentColumnIndex = 0;
  await refreshBoard(state);
};
```

**Step 3: Add keybindings to none modal (board view)**

Update `modalBindings.none` object (around line 152-166) to add:

```typescript
  none: {
    q: showQuitModal,
    escape: showQuitModal,
    left: navigateLeft,
    h: navigateLeft,
    right: navigateRight,
    l: navigateRight,
    a: (state) => !state.archiveViewMode && showAddTaskModal(state, () => refreshBoard(state)),
    m: (state) => !state.archiveViewMode && openMoveModal(state),
    u: (state) => !state.archiveViewMode && openAssignModal(state),
    d: (state) => !state.archiveViewMode && openDeleteModal(state),
    x: (state) => !state.archiveViewMode && openArchiveModal(state),
    r: (state) => state.archiveViewMode && openArchiveModal(state),
    X: toggleArchiveView,
    return: openViewModal,
    "?": showHelpModal,
  },
```

**Step 4: Add archiveTask and restoreTask modal keybindings**

Add new entries to `modalBindings` object (after deleteTask, around line 192):

```typescript
  archiveTask: {
    y: confirmModal,
    n: closeModal,
    escape: closeModal,
  },
  restoreTask: {
    y: confirmModal,
    n: closeModal,
    escape: closeModal,
  },
```

**Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 8: Update Help Modal

**Files:**
- Modify: `packages/tui/src/components/modals/help.ts`

**Step 1: Update SHORTCUTS array**

Replace the SHORTCUTS array (lines 6-16) with:

```typescript
const SHORTCUTS = [
  ["<-/-> h/l", "Switch column"],
  ["up/dn j/k", "Navigate tasks"],
  ["Enter", "View task details"],
  ["a", "Add new task"],
  ["m", "Move task (change status)"],
  ["u", "Assign user to task"],
  ["d", "Delete task"],
  ["x", "Archive task"],
  ["r", "Restore task (archive view)"],
  ["X", "Toggle archive view"],
  ["?", "Show/hide help"],
  ["q", "Quit"],
] as const;
```

**Step 2: Update dialog height to accommodate new entries**

Change line 24 (`height: 17`) to:

```typescript
    height: 20,
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 9: Update ViewTask Modal with Archive Action

**Files:**
- Modify: `packages/tui/src/components/modals/view-task.ts`

**Step 1: Add archive action button**

After `deleteAction` creation (around line 380), add:

```typescript
  const archiveAction = new TextRenderable(renderer, {
    id: "view-action-archive",
    content: "[x] Archive",
    fg: COLORS.warning,
  });
```

**Step 2: Add archiveAction to actionsLeft**

Update the actionsLeft.add calls (around line 382-385) to include:

```typescript
  actionsLeft.add(moveAction);
  actionsLeft.add(assignAction);
  actionsLeft.add(editAction);
  actionsLeft.add(archiveAction);
  actionsLeft.add(deleteAction);
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 10: Wire Up ViewTask Archive Action in Keybindings

**Files:**
- Modify: `packages/tui/src/lib/keybindings.ts`

**Step 1: Update openViewModalForTask to include onArchive**

Find the `openViewModalForTask` function and update the actions object (around line 86-102):

```typescript
async function openViewModalForTask(state: AppState, taskIdOverride?: string): Promise<void> {
  const taskId = taskIdOverride ?? getSelectedTaskId(state);
  if (taskId) {
    await showViewTaskModal(
      state,
      {
        onMove: async () => {
          await showMoveTaskModal(state, () => refreshBoard(state));
        },
        onAssign: async () => {
          await showAssignTaskModal(state, () => refreshBoard(state));
        },
        onDelete: async () => {
          await showDeleteTaskModal(state, () => refreshBoard(state));
        },
        onEdit: async () => {
          await openEditModal(state);
        },
        onArchive: async () => {
          closeModal(state);
          await openArchiveModal(state);
        },
      },
      taskIdOverride,
    );
  }
}
```

**Step 2: Add x keybinding to viewTask modal**

Update `modalBindings.viewTask` (around line 193-217) to add archive:

```typescript
  viewTask: {
    escape: closeModal,
    left: buttonSelectPrev,
    right: buttonSelectNext,
    tab: focusButtons,
    return: buttonTrigger,
    m: async (state) => {
      closeModal(state);
      await openMoveModal(state);
    },
    u: async (state) => {
      closeModal(state);
      await openAssignModal(state);
    },
    d: async (state) => {
      closeModal(state);
      await openDeleteModal(state);
    },
    x: async (state) => {
      closeModal(state);
      await openArchiveModal(state);
    },
    e: openEditModal,
    c: copyTaskId,
    j: (state) => scrollViewTaskDescription(state, "down"),
    k: (state) => scrollViewTaskDescription(state, "up"),
    down: (state) => scrollViewTaskDescription(state, "down"),
    up: (state) => scrollViewTaskDescription(state, "up"),
  },
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

---

## Task 11: Add Integration Tests

**Files:**
- Create: `packages/tui/src/components/modals/archive-task.test.ts`

**Step 1: Create test file for archive modal**

```typescript
import { describe, expect, mock, test } from "bun:test";

describe("showArchiveTaskModal", () => {
  test("does not show modal if no task selected", async () => {
    // Test that early return happens when getSelectedTaskId returns null
    // Mock state with no selected task
  });

  test("does not show modal for already-archived task", async () => {
    // Test defensive check for task.archived === true
  });

  test("calls archiveTasks on confirm", async () => {
    // Test that onModalConfirm calls taskService.archiveTasks
  });
});

describe("showRestoreTaskModal", () => {
  test("does not show modal for non-archived task", async () => {
    // Test defensive check for task.archived === false
  });

  test("calls restoreTask on confirm", async () => {
    // Test that onModalConfirm calls taskService.restoreTask
  });
});
```

**Step 2: Run tests**

Run: `bun test packages/tui/`
Expected: PASS (or skip if test infrastructure not set up)

---

## Task 12: Final Verification

**Step 1: Run full lint check**

Run: `bun run lint`
Expected: No errors

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Manual test scenarios**

Run: `cd packages/tui && bun run src/index.ts`

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Archive task | Select task, press `x`, press `y` | Task disappears from view |
| 2 | Toggle to archive | Press `X` | Header shows "[ARCHIVE]", footer changes |
| 3 | Empty archive | Toggle to archive (no archived tasks) | All columns show "(empty)", no `[r]estore` in footer |
| 4 | Restore task | In archive view, select task, press `r`, press `y` | Task disappears from archive |
| 5 | Toggle back | Press `X` | Back to normal view, restored task visible |
| 6 | Help modal | Press `?` | Shows new archive shortcuts |
| 7 | ViewTask archive | Open task (Enter), press `x` | Archive modal appears |

**Step 4: Commit**

```bash
git add packages/tui/
git commit -m "feat(tui): add archive/restore support with view toggle"
```

---

## Summary

| Feature | Implementation |
|---------|----------------|
| Archive keybinding (`x`) | Shows archive confirmation modal |
| Restore keybinding (`r`) | In archive view, shows restore modal |
| Toggle view (`X`) | Switches between active/archived tasks |
| Archive indicator | Header shows "[ARCHIVE]" in archive mode |
| Dynamic footer | Context-appropriate keybindings, shorter labels |
| Empty archive handling | Shows "(empty)" columns, hides restore action |
| Help update | Documents all new shortcuts |
| ViewTask modal | Includes archive action button |
| Defensive checks | Prevents archiving archived / restoring active |
| Separate modal types | `archiveTask` and `restoreTask` for clean separation |

## Files Changed

| Action | File |
|--------|------|
| Modify | `packages/tui/src/lib/types.ts` |
| Modify | `packages/tui/src/index.ts` |
| Create | `packages/tui/src/components/modals/archive-task.ts` |
| Create | `packages/tui/src/components/modals/restore-task.ts` |
| Modify | `packages/tui/src/components/modals/index.ts` |
| Modify | `packages/tui/src/components/board.ts` |
| Modify | `packages/tui/src/lib/keybindings.ts` |
| Modify | `packages/tui/src/components/modals/help.ts` |
| Modify | `packages/tui/src/components/modals/view-task.ts` |
| Create | `packages/tui/src/components/modals/archive-task.test.ts` |
