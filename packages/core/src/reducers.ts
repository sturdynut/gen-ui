import type { LocalAction } from './types';
import { StateStore } from './state';

/**
 * Applies a built-in local reducer to the StateStore.
 * Returns true if the action was handled (no LLM round-trip needed).
 */
export function applyLocalAction(store: StateStore, action: LocalAction): boolean {
  if (!action.reducer) return false;

  switch (action.reducer) {
    case 'set-state':
      if (action.path != null) {
        store.set(action.path, action.value ?? null);
        return true;
      }
      return false;

    case 'toggle-state':
      if (action.path != null) {
        store.toggle(action.path);
        return true;
      }
      return false;

    case 'inc-state':
      if (action.path != null) {
        store.inc(action.path, 1);
        return true;
      }
      return false;

    case 'dec-state':
      if (action.path != null) {
        store.inc(action.path, -1);
        return true;
      }
      return false;

    default:
      return false;
  }
}
