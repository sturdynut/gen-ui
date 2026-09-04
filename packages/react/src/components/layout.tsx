import type { StackComponent, GridComponent, SectionComponent } from '@genui/core';
import { renderComponent } from '../render';

interface StackProps { component: StackComponent }
export function Stack({ component }: StackProps) {
  const { direction = 'vertical', gap = 'md', align = 'start', children = [], id, aria } = component;
  return (
    <div
      id={id}
      className="genui-stack"
      data-direction={direction}
      data-gap={gap}
      data-align={align}
      aria-label={aria?.label}
      role={aria?.role}
      aria-live={aria?.live}
    >
      {children.map((child, i) => renderComponent(child, i))}
    </div>
  );
}

interface GridProps { component: GridComponent }
export function Grid({ component }: GridProps) {
  const { columns = 'auto', gap = 'md', children = [], id, aria } = component;
  const cols = typeof columns === 'number' ? columns : undefined;
  return (
    <div
      id={id}
      className="genui-grid"
      data-gap={gap}
      style={cols !== undefined ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
      aria-label={aria?.label}
      role={aria?.role}
    >
      {children.map((child, i) => renderComponent(child, i))}
    </div>
  );
}

interface SectionProps { component: SectionComponent }
export function Section({ component }: SectionProps) {
  const { title, description, children = [], id, aria } = component;
  return (
    <section
      id={id}
      className="genui-section"
      aria-label={aria?.label ?? title}
      role={aria?.role}
    >
      {(title || description) && (
        <div className="genui-section__header">
          {title && <h2 className="genui-section__title">{title}</h2>}
          {description && <p className="genui-section__description">{description}</p>}
        </div>
      )}
      {children.map((child, i) => renderComponent(child, i))}
    </section>
  );
}
