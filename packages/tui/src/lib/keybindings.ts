import { refreshBoard } from "../components/board.js";
import {
  cancelEditTask,
  closeModal,
  copyTaskId,
  focusNextEditField,
  scrollViewTaskDescription,
  showAddTaskModal,
  showAssignTaskModal,
  showDeleteTaskModal,
  showEditTaskModal,
  showHelpModal,
  showMoveTaskModal,
  showQuitModal,
  showViewTaskModal,
} from "../components/modals/index.js";
import type { AppState, ModalType } from "./types.js";
import { getSelectedTaskId } from "./types.js";

type KeyHandler = (state: AppState) => void | Promise<void>;
type KeyBindings = Record<string, KeyHandler>;

const WILDCARD = "*";

const navigateLeft: KeyHandler = async (state) => {
  state.currentColumnIndex = Math.max(0, state.currentColumnIndex - 1);
  await refreshBoard(state);
};

const navigateRight: KeyHandler = async (state) => {
  state.currentColumnIndex = Math.min(state.columns.length - 1, state.currentColumnIndex + 1);
  await refreshBoard(state);
};

const quit: KeyHandler = (state) => {
  state.renderer.destroy();
  process.exit(0);
};

const openMoveModal: KeyHandler = async (state) => {
  const taskId = getSelectedTaskId(state);
  if (taskId) {
    await showMoveTaskModal(state, () => refreshBoard(state));
  }
};

const openAssignModal: KeyHandler = async (state) => {
  const taskId = getSelectedTaskId(state);
  if (taskId) {
    await showAssignTaskModal(state, () => refreshBoard(state));
  }
};

const openDeleteModal: KeyHandler = async (state) => {
  const taskId = getSelectedTaskId(state);
  if (taskId) {
    await showDeleteTaskModal(state, () => refreshBoard(state));
  }
};

const openEditModal: KeyHandler = async (state) => {
  const task = state.selectedTask;
  if (!task) return;

  const preservedTaskId = task.id;

  closeModal(state);
  state.selectedTask = task;

  await showEditTaskModal(state, {
    onSave: async () => {
      await refreshBoard(state);
      await openViewModalForTask(state, preservedTaskId);
    },
    onCancel: async () => {
      await openViewModalForTask(state, preservedTaskId);
    },
  });
};

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
      },
      taskIdOverride,
    );
  }
}

const openViewModal: KeyHandler = (state) => openViewModalForTask(state);

const buttonSelectPrev: KeyHandler = (state) => {
  if (state.taskInput?.focused) return;
  state.buttonRow?.selectPrev();
};

const buttonSelectNext: KeyHandler = (state) => {
  if (state.taskInput?.focused) return;
  state.buttonRow?.selectNext();
};

const buttonTrigger: KeyHandler = (state) => {
  if (state.taskInput?.focused) return;
  state.buttonRow?.triggerSelected();
};

const editTaskSave: KeyHandler = async (state) => {
  if (!state.editTaskRuntime) return;

  const focusedField = state.editTaskState?.focusedField;

  if (focusedField === "title") {
    return;
  }

  if (focusedField === "buttons") {
    state.buttonRow?.triggerSelected();
  } else {
    await state.editTaskRuntime.doSave();
  }
};

const focusButtons: KeyHandler = (state) => {
  state.taskInput?.blur();
  state.buttonRow?.setFocused(true);
};

const focusInput: KeyHandler = (state) => {
  state.buttonRow?.setFocused(false);
  state.taskInput?.focus();
};

const confirmModal: KeyHandler = async (state) => {
  await state.onModalConfirm?.();
};

const modalBindings: Record<ModalType, KeyBindings> = {
  none: {
    q: showQuitModal,
    escape: showQuitModal,
    left: navigateLeft,
    h: navigateLeft,
    right: navigateRight,
    l: navigateRight,
    a: (state) => showAddTaskModal(state, () => refreshBoard(state)),
    m: openMoveModal,
    u: openAssignModal,
    d: openDeleteModal,
    return: openViewModal,
    "?": showHelpModal,
  },
  addTask: {
    escape: closeModal,
    left: buttonSelectPrev,
    right: buttonSelectNext,
    tab: focusButtons,
    down: focusButtons,
    up: focusInput,
    return: buttonTrigger,
  },
  moveTask: {
    escape: closeModal,
  },
  assignTask: {
    escape: closeModal,
    left: buttonSelectPrev,
    right: buttonSelectNext,
    tab: focusButtons,
    down: focusButtons,
    up: focusInput,
    return: buttonTrigger,
  },
  deleteTask: {
    y: confirmModal,
    n: closeModal,
    escape: closeModal,
  },
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
    e: openEditModal,
    c: copyTaskId,
    j: (state) => scrollViewTaskDescription(state, "down"),
    k: (state) => scrollViewTaskDescription(state, "up"),
    down: (state) => scrollViewTaskDescription(state, "down"),
    up: (state) => scrollViewTaskDescription(state, "up"),
  },
  editTask: {
    escape: cancelEditTask,
    tab: focusNextEditField,
    left: buttonSelectPrev,
    right: buttonSelectNext,
    return: editTaskSave,
  },
  help: {
    [WILDCARD]: closeModal,
  },
  quit: {
    y: quit,
    n: closeModal,
    escape: closeModal,
  },
};

export function handleKeypress(
  state: AppState,
  key: { name: string; shift: boolean },
): void | Promise<void> {
  const bindings = modalBindings[state.activeModal];
  const handler = bindings[key.name] ?? bindings[WILDCARD];
  return handler?.(state);
}
