import type { ReactNode, CSSProperties } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
import { GenUIContext } from './context';
import { ComponentRegistry, defaultRegistry } from './registry';
import { renderComponent } from './render';
import { Spinner } from './components/state';

export interface GenUIRendererProps {
  /** Parsed and validated GenUI spec. Pass null to render nothing. */
  spec: GenUIRoot | null;

  /**
   * Called whenever an `llm` action is dispatched.
   * The host app is responsible for calling the LLM and updating `spec`.
   *
   * @param action  The dispatched action
   * @param formData  Field values when the action originates from a form submit
   * @param contextPayload  The result of onContextRequest (if context === 'custom')
   *                        or the current spec (if context === 'spec')
   */
  onAction: (
    action: Action,
    formData?: Record<string, unknown>,
    contextPayload?: unknown
  ) => void;

  /**
   * Called when an action has context === 'custom'.
   * The return value is passed as contextPayload to onAction.
   */
  onContextRequest?: () => unknown;

  /** Custom component registry. Defaults to the shared defaultRegistry. */
  registry?: ComponentRegistry;

  /**
   * Shown while status === 'streaming' (i.e. spec is null but a stream is in flight).
   * Defaults to a spinner.
   */
  loadingFallback?: ReactNode;

  /** Additional class name applied to the root container. */
  className?: string;

  /** Additional inline styles applied to the root container. */
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
  const handleAction = (action: Action, formData?: Record<string, unknown>) => {
    if (action.type === 'local') {
      // Local actions are fully handled by the individual components.
      // The host app receives them here for optional observability.
      onAction(action, formData);
      return;
    }

    let contextPayload: unknown;
    if (action.context === 'spec') {
      contextPayload = spec;
    } else if (action.context === 'custom') {
      contextPayload = onContextRequest?.();
    }

    onAction(action, formData, contextPayload);
  };

  const containerClass = ['genui', className].filter(Boolean).join(' ');

  return (
    <GenUIContext.Provider
      value={{
        onAction: handleAction,
        onContextRequest,
        registry,
        currentSpec: spec ?? undefined,
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
