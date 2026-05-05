import type { ReactNode } from 'react';
import type { Component } from '@genui/core';
import { isExtensionComponent } from '@genui/core';

import { Stack, Grid, Section } from './components/layout';
import { Text, Heading, Badge, Metric, Image, Divider, Code, Markdown } from './components/content';
import { Button, Input, Select, Toggle, Slider, Form } from './components/interactive';
import { Card, List, Table, Tabs, Accordion, Dialog } from './components/composite';
import { Spinner, Empty, ErrorDisplay } from './components/state';
import { Extension } from './components/extension';
import { useStateValue } from './hooks/useStateValue';

// ─── Visibility gate ──────────────────────────────────────────────────────────

interface ComponentGateProps {
  component: Component;
  index?: number | string;
}

/**
 * Wraps every component render. Checks `visibleIf` against the StateStore
 * and returns null (unmounts) when the condition is not met.
 */
function ComponentGate({ component, index }: ComponentGateProps) {
  const visibleIf = (component as { visibleIf?: { path: string; eq: unknown } }).visibleIf;
  // Always call the hook — safe because the path is stable within a render tree.
  const storeValue = useStateValue(visibleIf?.path ?? '__never__');

  if (visibleIf != null && storeValue !== visibleIf.eq) return null;

  return <>{inner(component, index)}</>;
}

// ─── Inner switch (no hooks) ──────────────────────────────────────────────────

function inner(component: Component, key?: number | string): ReactNode {
  if (isExtensionComponent(component)) {
    return <Extension key={key} component={component} />;
  }

  switch (component.type) {
    // Layout
    case 'stack':     return <Stack     key={key} component={component} />;
    case 'grid':      return <Grid      key={key} component={component} />;
    case 'section':   return <Section   key={key} component={component} />;
    // Content
    case 'text':      return <Text      key={key} component={component} />;
    case 'heading':   return <Heading   key={key} component={component} />;
    case 'badge':     return <Badge     key={key} component={component} />;
    case 'metric':    return <Metric    key={key} component={component} />;
    case 'image':     return <Image     key={key} component={component} />;
    case 'divider':   return <Divider   key={key} component={component} />;
    case 'code':      return <Code      key={key} component={component} />;
    case 'markdown':  return <Markdown  key={key} component={component} />;
    // Interactive
    case 'button':    return <Button    key={key} component={component} />;
    case 'input':     return <Input     key={key} component={component} />;
    case 'select':    return <Select    key={key} component={component} />;
    case 'toggle':    return <Toggle    key={key} component={component} />;
    case 'slider':    return <Slider    key={key} component={component} />;
    case 'form':      return <Form      key={key} component={component} />;
    // Composite
    case 'card':      return <Card      key={key} component={component} />;
    case 'list':      return <List      key={key} component={component} />;
    case 'table':     return <Table     key={key} component={component} />;
    case 'tabs':      return <Tabs      key={key} component={component} />;
    case 'accordion': return <Accordion key={key} component={component} />;
    case 'dialog':    return <Dialog    key={key} component={component} />;
    // State
    case 'spinner':   return <Spinner      key={key} component={component} />;
    case 'empty':     return <Empty        key={key} component={component} />;
    case 'error':     return <ErrorDisplay key={key} component={component} />;

    default: {
      const unknown = component as { type: string };
      return (
        <div key={key} className="genui-extension-fallback">
          Unknown component type: <strong>{unknown.type}</strong>
        </div>
      );
    }
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function renderComponent(component: Component, key?: number | string): ReactNode {
  return <ComponentGate key={key} component={component} index={key} />;
}
