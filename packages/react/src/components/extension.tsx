import { useGenUI } from '../context';
import type { ExtensionComponent } from '@genui/core';

interface ExtensionProps { component: ExtensionComponent }
export function Extension({ component }: ExtensionProps) {
  const { registry } = useGenUI();
  const Renderer = registry.get(component.type);

  if (Renderer) {
    return <Renderer component={component} />;
  }

  return (
    <div className="genui-extension-fallback" aria-label={`Unknown component: ${component.type}`}>
      Unknown component: <strong>{component.type}</strong>
    </div>
  );
}
