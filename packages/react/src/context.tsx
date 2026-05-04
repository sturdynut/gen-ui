import { createContext, useContext } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
import type { ComponentRegistry } from './registry';

export interface GenUIContextValue {
  onAction: (action: Action, formData?: Record<string, unknown>) => void;
  onContextRequest?: () => unknown;
  registry: ComponentRegistry;
  currentSpec?: GenUIRoot;
}

export const GenUIContext = createContext<GenUIContextValue | null>(null);

export function useGenUI(): GenUIContextValue {
  const ctx = useContext(GenUIContext);
  if (!ctx) {
    throw new Error('useGenUI must be used inside <GenUIRenderer>');
  }
  return ctx;
}
