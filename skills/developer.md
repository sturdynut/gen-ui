# GenUI Developer Skill

A Claude Code skill for developers building applications with GenUI. Use `/developer` (or however this skill is registered) to get help scaffolding, debugging, and extending GenUI in your project.

---

## What this skill can do

- Scaffold a GenUI integration in a React app
- Generate custom extension component stubs
- Debug malformed or invalid GenUI JSON from LLM responses
- Write a system prompt for a specific application domain
- Explain spec behaviour and renderer internals

---

## Quick-start scaffold

Ask: *"Scaffold a GenUI chat component for my React app"*

The assistant will generate a `GenUIChat.tsx` component that:
1. Calls your LLM endpoint with the GenUI system prompt
2. Uses `useGenUIStream` to consume the response stream
3. Renders the result with `<GenUIRenderer>`
4. Passes `onAction` back to the LLM for follow-up turns

Minimal example output:

```tsx
import { useCallback } from 'react';
import {
  GenUIRenderer,
  useGenUIStream,
  type Action,
} from '@genui/react';
import '@genui/react/theme.css';

export function GenUIChat() {
  // spec, status, and error are all managed by the hook
  const { spec, status, error, consume } = useGenUIStream();

  const callLLM = useCallback(async (
    userMessage: string,
    contextPayload?: unknown
  ) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, context: contextPayload }),
    });

    if (!response.body) throw new Error('No response body');

    await consume(readableStreamToStringIterable(response.body));
  }, [consume]);

  const handleAction = useCallback((
    action: Action,
    formData?: Record<string, unknown>,
    contextPayload?: unknown
  ) => {
    if (action.type !== 'llm') return;
    const payload = { ...action.payload, ...formData };
    callLLM(JSON.stringify(payload), contextPayload);
  }, [callLLM]);

  return (
    <>
      {status === 'error' && (
        <p role="alert" style={{ color: 'var(--genui-color-danger)' }}>{error}</p>
      )}
      <GenUIRenderer
        spec={spec}
        onAction={handleAction}
        loadingFallback={<div>Thinking…</div>}
      />
    </>
  );
}

async function* readableStreamToStringIterable(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}
```

---

## Registering a custom component

Ask: *"Generate an `x:bar-chart` extension component"*

The assistant will:
1. Create the React component file
2. Register it with the GenUI registry
3. Add a description to your system prompt so the LLM knows it exists

Example:

```tsx
// components/BarChart.tsx
import type { ExtensionProps } from '@genui/react';

interface BarChartData {
  label: string;
  value: number;
}

export function BarChart({ component }: ExtensionProps) {
  const data = (component.props?.data ?? []) as BarChartData[];
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 32,
              height: `${(value / max) * 100}px`,
              background: 'var(--genui-color-primary)',
              borderRadius: 'var(--genui-radius-sm) var(--genui-radius-sm) 0 0',
            }}
            aria-label={`${label}: ${value}`}
          />
          <span style={{ fontSize: 'var(--genui-font-size-sm)', color: 'var(--genui-color-text-muted)' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// app.tsx — register before rendering
import { defaultRegistry } from '@genui/react';
import { BarChart } from './components/BarChart';

defaultRegistry.register('x:bar-chart', BarChart);
```

Add to your system prompt:

```
## Custom components

- x:bar-chart   props: { data: [{ label: string, value: number }] }
  Use to visualise numeric comparisons across a small number of categories (2–8).
```

---

## Debugging invalid GenUI output

Ask: *"The LLM returned this JSON but it's not rendering — can you debug it?"* and paste the raw string.

The assistant will:
1. Run `parseGenUIResponse(raw)` mentally and identify parse/validation errors
2. Explain what is wrong and why
3. Suggest a corrected version
4. If the error is systematic (e.g. the LLM always wraps output in markdown fences), suggest a system prompt fix

Common issues and fixes:

| Symptom | Cause | Fix |
|---|---|---|
| `Response is not valid JSON` | LLM wrapped output in ```json ... ``` | Strip fences before parsing, or strengthen the "no markdown" rule in the system prompt |
| `Missing required field "genui"` | LLM returned the root component directly | Instruct the LLM: "Always wrap in `{ "genui": "1.0", "root": ... }`" |
| `Field "root" must be a component object` | LLM returned `"root": [...]` (array) | Instruct the LLM: "root must be a single component, not an array. Use a stack to group multiple children." |
| Unknown component type shown as fallback | LLM invented a type not in the spec | Add the type to your extension registry, or update the system prompt to prohibit it |

---

## Writing a domain-specific system prompt

Ask: *"Write a GenUI system prompt for a customer support chat bot"*

The assistant will take the base system prompt from `spec/system-prompt.md` and prepend a domain context section:

```
## Application context

You are the AI assistant for Acme Support. Users ask about their orders, returns,
and billing. When you generate a UI, use the following guidelines:

- Use `card` to show order summaries (fields: order ID, status badge, date, total)
- Use `table` for line items
- Use `form` with a `select` for return reasons
- Use `badge` with variant "success" for delivered orders, "warning" for in-transit,
  "danger" for cancelled
- Always include a "Contact a human" button with variant "ghost" on every screen
```

---

## Theming

Ask: *"How do I apply my design system's colours to GenUI?"*

Override CSS variables on the `.genui` container:

```css
.genui {
  --genui-color-primary:    #7c3aed;   /* your brand purple */
  --genui-color-surface:    #18181b;   /* dark surface */
  --genui-color-bg:         #09090b;   /* dark background */
  --genui-color-text:       #fafafa;
  --genui-color-text-muted: #a1a1aa;
  --genui-color-border:     #27272a;
  --genui-radius-md:        12px;      /* rounder corners */
  --genui-font-sans:        "Inter", sans-serif;
}
```

Or scope per-instance:

```tsx
<GenUIRenderer
  spec={spec}
  onAction={handleAction}
  style={{
    '--genui-color-primary': '#7c3aed',
  } as React.CSSProperties}
/>
```

---

## Checking the spec version

```ts
import { checkVersion } from '@genui/core';

const result = checkVersion(response.genui);
if (!result.ok && result.reason === 'unknown-major') {
  showUpgradeNotice(result.version);
}
```

---

## API reference (key exports)

### `@genui/core`

| Export | Description |
|---|---|
| `parseGenUIStream(stream)` | Parse an `AsyncIterable<string>` from an LLM stream |
| `parseGenUIResponse(text)` | One-shot parse of a complete response string |
| `validateSpec(obj)` | Validate a parsed JSON object against the spec |
| `checkVersion(genui)` | Check only the version field |
| `isExtensionComponent(c)` | Type guard for `x:*` components |
| `isLlmAction(a)` | Type guard for `{ type: 'llm' }` actions |

### `@genui/react`

| Export | Description |
|---|---|
| `<GenUIRenderer>` | Main renderer component |
| `useGenUIStream()` | Hook for consuming LLM streams |
| `ComponentRegistry` | Class for registering extension components |
| `defaultRegistry` | Shared registry instance |
| `useGenUI()` | Context hook (for building custom component renderers) |
