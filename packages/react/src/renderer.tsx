import { useMemo, type ReactNode, type CSSProperties } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
import { StateStore, applyLocalAction } from '@genui/core';
import { GenUIContext } from './context';
import { ComponentRegistry, defaultRegistry } from './registry';
import { renderComponent } from './render';
import { Spinner } from './components/state';

export interface GenUIRendererProps {
  spec: GenUIRoot | null;

  /**
   * Called for `llm` actions and unhandled `local` actions (for host observability).
   * Local reducer actions (set-state, toggle-state, inc-state, dec-state) are
   * applied to the StateStore without reaching this callback.
   */
  onAction: (
    action: Action,
    formData?: Record<string, unknown>,
    contextPayload?: unknown
  ) => void;

  onContextRequest?: () => unknown;
  registry?: ComponentRegistry;
  loadingFallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function GenUIRenderer({
  spec,
  onAction,
  onContextRequest,
  registry = defaultRegistry,
  loadingFallback,
  className = '',
  style,
}: GenUIRendererProps) {
  // Re-create the store only when the spec's state definition changes.
  // Shallow-serialize spec.state so useMemo doesn't re-run on identical objects.
  const stateKey = spec?.state ? JSON.stringify(spec.state) : '';
  const stateStore = useMemo(
    () => new StateStore(spec?.state ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateKey]
  );

  const handleAction = (action: Action, formData?: Record<string, unknown>) => {
    if (action.type === 'local') {
      // Try to apply a built-in reducer first. If handled, skip the LLM.
      const handled = applyLocalAction(stateStore, action);
      if (handled) return;
      // Unhandled local actions (e.g. "navigate") bubble to the host.
      onAction(action, formData);
      return;
    }

    let contextPayload: unknown;
    if (action.context === 'spec') contextPayload = spec;
    else if (action.context === 'custom') contextPayload = onContextRequest?.();

    onAction(action, formData, contextPayload);
  };

  const containerClass = ['genui', className].filter(Boolean).join(' ');

  return (
    <GenUIContext.Provider
      value={{
        onAction: handleAction,
        ...(onContextRequest ? { onContextRequest } : {}),
        ...(spec ? { currentSpec: spec } : {}),
        registry,
        stateStore,
      }}
    >
      <div className={containerClass} style={style}>
        {spec === null
          ? (loadingFallback ?? (
              <Spinner component={{ type: 'spinner', label: 'Generating…' }} />
            ))
          : renderComponent(spec.root)}
      </div>
    </GenUIContext.Provider>
  );
}
