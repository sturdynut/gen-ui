import type { SpinnerComponent, EmptyComponent, ErrorComponent } from '@genui/core';
import { Button } from './interactive';

interface SpinnerProps { component: SpinnerComponent }
export function Spinner({ component }: SpinnerProps) {
  const { label = 'Loading…', id, aria } = component;
  return (
    <div id={id} className="genui-spinner" role="status" aria-label={aria?.label ?? label} aria-live="polite">
      <span className="genui-spinner__ring" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

interface EmptyProps { component: EmptyComponent }
export function Empty({ component }: EmptyProps) {
  const { title, description, action, id, aria } = component;
  return (
    <div id={id} className="genui-empty" aria-label={aria?.label}>
      <p className="genui-empty__title">{title}</p>
      {description && <p className="genui-empty__description">{description}</p>}
      {action && (
        <Button component={{ type: 'button', label: 'Try again', variant: 'primary', action }} />
      )}
    </div>
  );
}

interface ErrorProps { component: ErrorComponent }
export function ErrorDisplay({ component }: ErrorProps) {
  const { title, description, action, id, aria } = component;
  return (
    <div id={id} className="genui-error" role="alert" aria-label={aria?.label}>
      <p className="genui-error__title">{title}</p>
      {description && <p className="genui-error__description">{description}</p>}
      {action && (
        <Button component={{ type: 'button', label: 'Retry', variant: 'danger', action }} />
      )}
    </div>
  );
}
