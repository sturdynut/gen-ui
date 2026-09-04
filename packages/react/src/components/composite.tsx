import { useState, useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import type {
  CardComponent, ListComponent, TableComponent,
  TabsComponent, AccordionComponent, DialogComponent,
  Component,
} from '@genui/core';
import { isLlmAction } from '@genui/core';
import { useGenUI } from '../context';
import { renderComponent } from '../render';
import { Button } from './interactive';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps { component: CardComponent }
export function Card({ component }: CardProps) {
  const { onAction } = useGenUI();
  const { title, description, children, action, id, aria } = component;
  const clickable = !!action;

  const handleClick = useCallback(() => {
    if (action) onAction(action);
  }, [action, onAction]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (action && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onAction(action);
    }
  }, [action, onAction]);

  return (
    <div
      id={id}
      className={`genui-card${clickable ? ' genui-card--clickable' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={aria?.label ?? (clickable ? title : undefined)}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
    >
      {title && <h3 className="genui-card__title">{title}</h3>}
      {description && <p className="genui-card__description">{description}</p>}
      {children?.map((child: Component, i) => renderComponent(child, i))}
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

interface ListProps { component: ListComponent }
export function List({ component }: ListProps) {
  const { ordered = false, items = [], id, aria } = component;
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag id={id} className="genui-list" aria-label={aria?.label}>
      {items.map((item, i) => (
        <li key={i}>
          {typeof item === 'string' ? item : renderComponent(item as Component, i)}
        </li>
      ))}
    </Tag>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface TableProps { component: TableComponent }
export function Table({ component }: TableProps) {
  const { onAction } = useGenUI();
  const { columns = [], rows = [], action, id, aria } = component;
  const clickable = !!action;

  const handleRowClick = useCallback((row: Record<string, string | number>) => {
    if (!action) return;
    if (isLlmAction(action)) {
      onAction({ ...action, payload: { ...(action.payload ?? {}), row } });
    } else {
      onAction(action);
    }
  }, [action, onAction]);

  return (
    <div id={id} className="genui-table-wrapper" aria-label={aria?.label}>
      <table
        className="genui-table"
        data-clickable={clickable ? 'true' : undefined}
        aria-live={aria?.live}
      >
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              onClick={clickable ? () => handleRowClick(row) : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(row); }
              } : undefined}
              aria-label={clickable ? `Row ${ri + 1}` : undefined}
            >
              {columns.map(col => (
                <td key={col.key}>{row[col.key] ?? ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps { component: TabsComponent }
export function Tabs({ component }: TabsProps) {
  const { defaultTab = 0, items = [], id, aria } = component;
  const [activeTab, setActiveTab] = useState(defaultTab);
  const activeItem = items[activeTab];

  return (
    <div id={id} className="genui-tabs" aria-label={aria?.label}>
      <div className="genui-tabs__list" role="tablist">
        {items.map((item, i) => (
          <button
            key={i}
            role="tab"
            className="genui-tabs__tab"
            aria-selected={i === activeTab ? 'true' : 'false'}
            aria-controls={`${id ?? 'genui-tabs'}-panel-${i}`}
            id={`${id ?? 'genui-tabs'}-tab-${i}`}
            onClick={() => setActiveTab(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="genui-tabs__panel"
        role="tabpanel"
        id={`${id ?? 'genui-tabs'}-panel-${activeTab}`}
        aria-labelledby={`${id ?? 'genui-tabs'}-tab-${activeTab}`}
      >
        {activeItem?.children?.map((child: Component, i) => renderComponent(child, i))}
      </div>
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

interface AccordionProps { component: AccordionComponent }
export function Accordion({ component }: AccordionProps) {
  const { items = [], id, aria } = component;
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(items.map((item, i) => item.defaultOpen ? i : -1).filter(i => i >= 0))
  );

  const toggle = useCallback((i: number) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  return (
    <div id={id} className="genui-accordion" aria-label={aria?.label}>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const triggerId = `${id ?? 'genui-acc'}-trigger-${i}`;
        const contentId = `${id ?? 'genui-acc'}-content-${i}`;
        return (
          <div key={i} className="genui-accordion__item">
            <button
              id={triggerId}
              className="genui-accordion__trigger"
              aria-expanded={isOpen ? 'true' : 'false'}
              aria-controls={contentId}
              onClick={() => toggle(i)}
            >
              {item.title}
              <svg className="genui-accordion__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isOpen && (
              <div id={contentId} className="genui-accordion__content" role="region" aria-labelledby={triggerId}>
                {(item.children ?? []).map((child: Component, ci) => renderComponent(child, ci))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface DialogProps { component: DialogComponent; onClose?: () => void }
export function Dialog({ component, onClose }: DialogProps) {
  const { title, description, children, actions, id, aria } = component;
  const titleId = `${id ?? 'genui-dialog'}-title`;
  const descId = `${id ?? 'genui-dialog'}-desc`;

  const handleBackdropClick = useCallback((e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose?.();
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  return (
    <div
      className="genui-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        id={id}
        className="genui-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={aria?.label}
      >
        {title && <h2 id={titleId} className="genui-dialog__title">{title}</h2>}
        {description && <p id={descId} className="genui-dialog__description">{description}</p>}
        {children?.map((child: Component, i) => renderComponent(child, i))}
        {actions && actions.length > 0 && (
          <div className="genui-dialog__actions">
            {actions.map((btn, i) => <Button key={i} component={btn} />)}
          </div>
        )}
      </div>
    </div>
  );
}
