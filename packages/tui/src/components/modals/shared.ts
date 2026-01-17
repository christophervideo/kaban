import type { AppState } from "../../lib/types.js";

export function closeModal(state: AppState): void {
  if (state.viewTaskRuntime?.copyTimeoutId) {
    clearTimeout(state.viewTaskRuntime.copyTimeoutId);
  }

  if (state.modalOverlay) {
    state.modalOverlay.destroy();
    state.modalOverlay = null;
  }

  state.taskInput = null;
  state.buttonRow = null;
  state.selectedTask = null;
  state.onModalConfirm = null;
  state.viewTaskState = null;
  state.editTaskState = null;
  state.viewTaskRuntime = null;
  state.editTaskRuntime = null;
  state.activeModal = "none";

  refocusCurrentColumnSelect(state);
}

export function refocusCurrentColumnSelect(state: AppState): void {
  const column = state.columns[state.currentColumnIndex];
  if (!column) return;

  const select = state.taskSelects.get(column.id);
  if (select) {
    select.focus();
  }
}

export function blurCurrentColumnSelect(state: AppState): void {
  const column = state.columns[state.currentColumnIndex];
  if (!column) return;

  const select = state.taskSelects.get(column.id);
  if (select) {
    select.blur();
  }
}
