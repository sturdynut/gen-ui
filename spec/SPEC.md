# GenUI Specification — Version 1.0

GenUI is a JSON-based specification for describing user interfaces generatively. An LLM that knows this spec can produce valid GenUI JSON; any renderer that implements this spec can render that JSON into native UI components.

The spec is intentionally semantic: it describes **what** the UI is, not **how** it looks. Renderers apply their own design system via CSS variables.

---

## Table of Contents

1. [Root Envelope](#1-root-envelope)
2. [Component Node](#2-component-node)
3. [Core Component Types](#3-core-component-types)
   - [Layout](#31-layout)
   - [Content](#32-content)
   - [Interactive](#33-interactive)
   - [Composite](#34-composite)
   - [State](#35-state)
4. [Action Model](#4-action-model)
5. [Form Validation](#5-form-validation)
6. [Accessibility](#6-accessibility)
7. [Theming](#7-theming)
8. [Extensions](#8-extensions)
9. [Versioning](#9-versioning)

---

## 1. Root Envelope

Every GenUI response is a JSON object with a `genui` version field and a single `root` component.

```json
{
  "genui": "1.0",
  "root": { ...component }
}
```

| Field   | Type      | Required | Description                        |
|---------|-----------|----------|------------------------------------|
| `genui` | `string`  | yes      | Spec version. Must be `"1.0"`.     |
| `root`  | Component | yes      | The top-level component to render. |

---

## 2. Component Node

Every component shares a common base shape.

```json
{
  "type": "...",
  "id": "...",
  "aria": { ... },
  ...type-specific fields
}
```

| Field  | Type   | Required | Description                                               |
|--------|--------|----------|-----------------------------------------------------------|
| `type` | string | yes      | Component type (see §3) or extension type (see §8).       |
| `id`   | string | no       | Stable identifier. Used for action targeting and a11y refs. |
| `aria` | Aria   | no       | Accessibility metadata (see §6).                          |

---

## 3. Core Component Types

### 3.1 Layout

#### `stack`

Arranges children sequentially along a single axis.

```json
{
  "type": "stack",
  "direction": "vertical",
  "gap": "md",
  "align": "start",
  "children": [ ...components ]
}
```

| Field       | Type                                    | Default      |
|-------------|-----------------------------------------|--------------|
| `direction` | `"vertical"` \| `"horizontal"`          | `"vertical"` |
| `gap`       | `"none"` \| `"sm"` \| `"md"` \| `"lg"` | `"md"`       |
| `align`     | `"start"` \| `"center"` \| `"end"` \| `"stretch"` | `"start"` |
| `children`  | Component[]                             | required     |

---

#### `grid`

Arranges children in a multi-column grid.

```json
{
  "type": "grid",
  "columns": 2,
  "gap": "md",
  "children": [ ...components ]
}
```

| Field      | Type                                    | Default  |
|------------|-----------------------------------------|----------|
| `columns`  | `number` \| `"auto"`                   | `"auto"` |
| `gap`      | `"none"` \| `"sm"` \| `"md"` \| `"lg"` | `"md"`   |
| `children` | Component[]                             | required |

---

#### `section`

A semantic container with an optional header.

```json
{
  "type": "section",
  "title": "Results",
  "description": "Showing 3 of 12 matches",
  "children": [ ...components ]
}
```

| Field         | Type        | Required |
|---------------|-------------|----------|
| `title`       | string      | no       |
| `description` | string      | no       |
| `children`    | Component[] | yes      |

---

### 3.2 Content

#### `text`

A paragraph of plain text.

```json
{
  "type": "text",
  "content": "Here is the summary.",
  "variant": "default"
}
```

| Field     | Type                                              | Default     |
|-----------|---------------------------------------------------|-------------|
| `content` | string                                            | required    |
| `variant` | `"default"` \| `"muted"` \| `"strong"` \| `"emphasis"` | `"default"` |

---

#### `heading`

A semantic heading (h1–h6).

```json
{
  "type": "heading",
  "content": "Search Results",
  "level": 2
}
```

| Field     | Type          | Default |
|-----------|---------------|---------|
| `content` | string        | required |
| `level`   | `1`–`6`       | `2`     |

---

#### `badge`

A small inline label for status or categorization.

```json
{
  "type": "badge",
  "label": "In Stock",
  "variant": "success"
}
```

| Field     | Type                                                               | Default     |
|-----------|--------------------------------------------------------------------|-------------|
| `label`   | string                                                             | required    |
| `variant` | `"default"` \| `"primary"` \| `"success"` \| `"warning"` \| `"danger"` | `"default"` |

---

#### `metric`

A key–value pair for displaying a stat or measurement.

```json
{
  "type": "metric",
  "label": "Revenue",
  "value": "$84,200",
  "delta": "+12%",
  "deltaVariant": "positive"
}
```

| Field          | Type                                          | Required |
|----------------|-----------------------------------------------|----------|
| `label`        | string                                        | yes      |
| `value`        | string \| number                              | yes      |
| `delta`        | string                                        | no       |
| `deltaVariant` | `"positive"` \| `"negative"` \| `"neutral"`  | no       |

---

#### `image`

An image with required alt text.

```json
{
  "type": "image",
  "src": "https://example.com/photo.jpg",
  "alt": "A red apple on a white background",
  "caption": "Granny Smith apple"
}
```

| Field     | Type   | Required |
|-----------|--------|----------|
| `src`     | string | yes      |
| `alt`     | string | yes      |
| `caption` | string | no       |

---

#### `divider`

A horizontal visual separator.

```json
{ "type": "divider" }
```

---

#### `code`

A syntax-highlighted code block.

```json
{
  "type": "code",
  "content": "const x = 42;",
  "language": "javascript"
}
```

| Field      | Type   | Required |
|------------|--------|----------|
| `content`  | string | yes      |
| `language` | string | no       |

---

#### `markdown`

Inline markdown rendered as formatted text.

```json
{
  "type": "markdown",
  "content": "Here is **bold** text and a [link](https://example.com)."
}
```

| Field     | Type   | Required |
|-----------|--------|----------|
| `content` | string | yes      |

---

### 3.3 Interactive

#### `button`

A clickable control that dispatches an action.

```json
{
  "type": "button",
  "label": "Search",
  "variant": "primary",
  "size": "md",
  "disabled": false,
  "action": { ...action }
}
```

| Field      | Type                                                                    | Default     |
|------------|-------------------------------------------------------------------------|-------------|
| `label`    | string                                                                  | required    |
| `variant`  | `"default"` \| `"primary"` \| `"secondary"` \| `"danger"` \| `"ghost"` | `"default"` |
| `size`     | `"sm"` \| `"md"` \| `"lg"`                                             | `"md"`      |
| `disabled` | boolean                                                                 | `false`     |
| `action`   | Action                                                                  | required    |

---

#### `input`

A single-line text field.

```json
{
  "type": "input",
  "name": "email",
  "label": "Email address",
  "placeholder": "you@example.com",
  "inputType": "email",
  "value": "",
  "validation": { ...validation },
  "action": { ...action }
}
```

| Field        | Type                                                                      | Default  |
|--------------|---------------------------------------------------------------------------|----------|
| `name`       | string                                                                    | required |
| `label`      | string                                                                    | no       |
| `placeholder`| string                                                                    | no       |
| `inputType`  | `"text"` \| `"email"` \| `"number"` \| `"password"` \| `"tel"` \| `"url"` | `"text"` |
| `value`      | string                                                                    | `""`     |
| `validation` | Validation                                                                | no       |
| `action`     | Action (fires on change or submit)                                        | no       |

---

#### `select`

A dropdown selector.

```json
{
  "type": "select",
  "name": "country",
  "label": "Country",
  "options": [
    { "value": "us", "label": "United States" },
    { "value": "ca", "label": "Canada" }
  ],
  "value": "us",
  "validation": { ...validation },
  "action": { ...action }
}
```

| Field        | Type                            | Required |
|--------------|---------------------------------|----------|
| `name`       | string                          | yes      |
| `label`      | string                          | no       |
| `options`    | `{ value: string, label: string }[]` | yes |
| `value`      | string                          | no       |
| `validation` | Validation                      | no       |
| `action`     | Action                          | no       |

---

#### `toggle`

A boolean checkbox or switch.

```json
{
  "type": "toggle",
  "name": "notifications",
  "label": "Enable notifications",
  "checked": false,
  "action": { ...action }
}
```

| Field     | Type    | Required |
|-----------|---------|----------|
| `name`    | string  | yes      |
| `label`   | string  | no       |
| `checked` | boolean | no       |
| `action`  | Action  | no       |

---

#### `slider`

A range input.

```json
{
  "type": "slider",
  "name": "volume",
  "label": "Volume",
  "min": 0,
  "max": 100,
  "step": 1,
  "value": 50,
  "action": { ...action }
}
```

| Field    | Type   | Default |
|----------|--------|---------|
| `name`   | string | required |
| `label`  | string | no      |
| `min`    | number | `0`     |
| `max`    | number | `100`   |
| `step`   | number | `1`     |
| `value`  | number | `min`   |
| `action` | Action | no      |

---

#### `form`

A container that groups inputs and dispatches a single submit action.

```json
{
  "type": "form",
  "children": [ ...input components ],
  "submitLabel": "Submit",
  "validationStrategy": "on-submit",
  "action": { ...action }
}
```

| Field                | Type                                                 | Default       |
|----------------------|------------------------------------------------------|---------------|
| `children`           | Component[]                                          | required      |
| `submitLabel`        | string                                               | `"Submit"`    |
| `validationStrategy` | `"on-submit"` \| `"on-blur"` \| `"on-change"`        | `"on-submit"` |
| `action`             | Action (fired on valid submit)                       | required      |

---

### 3.4 Composite

#### `card`

An elevated container. When `action` is provided the entire card is clickable.

```json
{
  "type": "card",
  "title": "Product Name",
  "description": "Short description",
  "children": [ ...components ],
  "action": { ...action }
}
```

| Field         | Type        | Required |
|---------------|-------------|----------|
| `title`       | string      | no       |
| `description` | string      | no       |
| `children`    | Component[] | no       |
| `action`      | Action      | no       |

---

#### `list`

An ordered or unordered list of components or strings.

```json
{
  "type": "list",
  "ordered": false,
  "items": [
    { "type": "text", "content": "First item" },
    { "type": "text", "content": "Second item" }
  ]
}
```

| Field     | Type                       | Default |
|-----------|----------------------------|---------|
| `ordered` | boolean                    | `false` |
| `items`   | (Component \| string)[]    | required |

---

#### `table`

Tabular data with optional row-click actions.

```json
{
  "type": "table",
  "columns": [
    { "key": "name", "label": "Name", "width": "auto" },
    { "key": "status", "label": "Status" }
  ],
  "rows": [
    { "name": "Alice", "status": "Active" },
    { "name": "Bob",   "status": "Inactive" }
  ],
  "action": { ...action }
}
```

| Field     | Type                                                    | Required |
|-----------|---------------------------------------------------------|----------|
| `columns` | `{ key: string, label: string, width?: string }[]`      | yes      |
| `rows`    | `Record<string, string \| number>[]`                    | yes      |
| `action`  | Action (receives `{ row }` in payload on row click)     | no       |

---

#### `tabs`

A tabbed interface with local navigation.

```json
{
  "type": "tabs",
  "defaultTab": 0,
  "items": [
    { "label": "Overview", "children": [ ...components ] },
    { "label": "Details",  "children": [ ...components ] }
  ]
}
```

| Field        | Type                                            | Default |
|--------------|-------------------------------------------------|---------|
| `defaultTab` | number (index)                                  | `0`     |
| `items`      | `{ label: string, children: Component[] }[]`    | required |

Tab switching is a `local` action handled by the renderer with no LLM round-trip.

---

#### `accordion`

Expandable and collapsible sections.

```json
{
  "type": "accordion",
  "items": [
    {
      "title": "Section 1",
      "defaultOpen": true,
      "children": [ ...components ]
    }
  ]
}
```

| Field   | Type                                                              | Required |
|---------|-------------------------------------------------------------------|----------|
| `items` | `{ title: string, defaultOpen?: boolean, children: Component[] }[]` | yes   |

---

#### `dialog`

A modal overlay, typically presented as an `llm` action response.

```json
{
  "type": "dialog",
  "title": "Confirm deletion",
  "description": "This cannot be undone.",
  "children": [ ...components ],
  "actions": [ ...buttons ]
}
```

| Field         | Type       | Required |
|---------------|------------|----------|
| `title`       | string     | no       |
| `description` | string     | no       |
| `children`    | Component[]| no       |
| `actions`     | button[]   | no       |

---

### 3.5 State

#### `spinner`

A loading indicator, shown while awaiting an LLM response.

```json
{ "type": "spinner", "label": "Loading results…" }
```

| Field   | Type   | Required |
|---------|--------|----------|
| `label` | string | no       |

---

#### `empty`

An empty-state placeholder with an optional call to action.

```json
{
  "type": "empty",
  "title": "No results found",
  "description": "Try adjusting your search.",
  "action": { ...action }
}
```

| Field         | Type   | Required |
|---------------|--------|----------|
| `title`       | string | yes      |
| `description` | string | no       |
| `action`      | Action | no       |

---

#### `error`

An error state with a retry affordance.

```json
{
  "type": "error",
  "title": "Something went wrong",
  "description": "The response could not be parsed.",
  "action": {
    "type": "llm",
    "payload": { "retry": true },
    "context": "none"
  }
}
```

| Field         | Type   | Required |
|---------------|--------|----------|
| `title`       | string | yes      |
| `description` | string | no       |
| `action`      | Action | no       |

This component is also injected automatically by the renderer when an LLM response fails to parse as valid GenUI JSON.

---

## 4. Action Model

Actions describe what happens when the user interacts with a component. There are two kinds: `llm` (triggers an LLM call) and `local` (handled by the renderer without a round-trip).

### `llm` action

```json
{
  "type": "llm",
  "payload": { "query": "show me more results" },
  "context": "spec"
}
```

| Field     | Type                                   | Required | Description                                            |
|-----------|----------------------------------------|----------|--------------------------------------------------------|
| `type`    | `"llm"`                                | yes      |                                                        |
| `payload` | object                                 | no       | Data passed to the `onAction` handler and on to the LLM. |
| `context` | `"none"` \| `"spec"` \| `"custom"`     | no       | What context is sent alongside the action (see below). |

**Context strategies:**

| Value      | What is sent to the LLM                                     |
|------------|-------------------------------------------------------------|
| `"none"`   | `payload` only. Lightest; use for stateless interactions.   |
| `"spec"`   | Current rendered spec + `payload`. LLM sees what's on screen. |
| `"custom"` | Whatever the host app returns from its `onContextRequest` callback. |

### `local` action

```json
{
  "type": "local",
  "event": "navigate",
  "target": "tab-1"
}
```

| Field    | Type     | Required | Description                                      |
|----------|----------|----------|--------------------------------------------------|
| `type`   | `"local"`| yes      |                                                  |
| `event`  | string   | yes      | Event name. Renderers define the supported set.  |
| `target` | string   | no       | `id` of the component to act on.                 |

Built-in local events: `toggle-tab`, `toggle-accordion`, `close-dialog`.

---

## 5. Form Validation

Validation rules are declared on `input`, `select`, and `toggle` components. The renderer enforces them; the LLM should include rules that match the field's purpose.

```json
{
  "required": true,
  "min": 0,
  "max": 100,
  "minLength": 1,
  "maxLength": 255,
  "pattern": "email",
  "message": "Please enter a valid email address."
}
```

| Field       | Type                                                        | Applies to         |
|-------------|-------------------------------------------------------------|--------------------|
| `required`  | boolean                                                     | all                |
| `min`       | number                                                      | `number` inputs    |
| `max`       | number                                                      | `number` inputs    |
| `minLength` | number                                                      | text inputs        |
| `maxLength` | number                                                      | text inputs        |
| `pattern`   | `"email"` \| `"url"` \| `"phone"` \| `"/regex/"` (string) | text inputs        |
| `message`   | string                                                      | all (error text)   |

When `pattern` is a string wrapped in `/` delimiters it is treated as a regular expression.

---

## 6. Accessibility

Any component may carry an `aria` object. LLMs should populate this for interactive and content components.

```json
{
  "aria": {
    "label": "Search results",
    "describedby": "results-summary",
    "role": "region",
    "live": "polite"
  }
}
```

| Field         | Type                         | Description                               |
|---------------|------------------------------|-------------------------------------------|
| `label`       | string                       | Maps to `aria-label`.                     |
| `describedby` | string                       | `id` of a describing element.             |
| `role`        | string                       | ARIA landmark or widget role.             |
| `live`        | `"polite"` \| `"assertive"` | For dynamic content regions.              |

---

## 7. Theming

Renderers expose a set of CSS custom properties. Host applications override them to apply their design system. The spec defines the token names; the renderer ships sensible defaults.

### Color tokens

| Token                        | Purpose                 |
|------------------------------|-------------------------|
| `--genui-color-bg`           | Page/surface background |
| `--genui-color-surface`      | Card/panel background   |
| `--genui-color-border`       | Border color            |
| `--genui-color-text`         | Body text               |
| `--genui-color-text-muted`   | Secondary text          |
| `--genui-color-primary`      | Primary action color    |
| `--genui-color-success`      | Success state           |
| `--genui-color-warning`      | Warning state           |
| `--genui-color-danger`       | Destructive action      |

### Spacing tokens

| Token               | Purpose          |
|---------------------|------------------|
| `--genui-space-sm`  | Small gap/padding  |
| `--genui-space-md`  | Medium gap/padding |
| `--genui-space-lg`  | Large gap/padding  |

### Typography tokens

| Token                   | Purpose          |
|-------------------------|------------------|
| `--genui-font-sans`     | Body font family |
| `--genui-font-mono`     | Code font family |
| `--genui-font-size-sm`  | Small text size  |
| `--genui-font-size-md`  | Body text size   |
| `--genui-font-size-lg`  | Large text size  |

### Shape tokens

| Token                 | Purpose        |
|-----------------------|----------------|
| `--genui-radius-sm`   | Small radius   |
| `--genui-radius-md`   | Medium radius  |
| `--genui-radius-lg`   | Large radius   |

---

## 8. Extensions

Custom component types use an `x:` namespace prefix.

```json
{
  "type": "x:bar-chart",
  "props": {
    "data": [
      { "month": "Jan", "revenue": 4200 },
      { "month": "Feb", "revenue": 5100 }
    ],
    "xAxis": "month",
    "yAxis": "revenue"
  }
}
```

The renderer SDK provides a `register` API:

```typescript
// @genui/react example
registry.register("x:bar-chart", BarChartComponent);
```

If a renderer encounters an unknown `x:` type it MUST render a visible fallback rather than throwing. The spec SHOULD be included in the system prompt alongside documentation of any custom types so the LLM knows they are available.

---

## 9. Versioning

The `genui` field in the root envelope carries the spec version. Renderers MUST check this field before rendering.

| Scenario                                       | Renderer behavior                     |
|------------------------------------------------|---------------------------------------|
| Version matches supported range                | Render normally                       |
| Version is a higher minor (`1.1`, `1.2`, …)   | Render with best-effort; ignore unknown fields |
| Version is a higher major (`2.0`, …)           | Render the `error` fallback component |
| Field is absent or unparseable                 | Render the `error` fallback component |

Spec versions follow [Semantic Versioning](https://semver.org/). Minor versions are backwards-compatible. Major versions are breaking.
