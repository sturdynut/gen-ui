# GenUI Generation Skill

This skill teaches an LLM to generate valid GenUI JSON. Include it in system prompts alongside the [GenUI system prompt](../spec/system-prompt.md).

---

## Purpose

Use this skill when you want to give an LLM additional guidance on *how* to produce good GenUI output — beyond the basic spec rules. It covers common patterns, anti-patterns, and decision heuristics that lead to higher-quality generated UIs.

---

## Generation heuristics

### Choose the right root component

| User intent                          | Root component       |
|--------------------------------------|----------------------|
| Show a single piece of information   | `card`               |
| Show multiple related items          | `section` with `stack` |
| Show a data set                      | `table` or `list`    |
| Show a comparison                    | `grid` of `card`s    |
| Collect input                        | `form` inside `card` |
| Show a multi-step flow               | `tabs` or `accordion`|
| Acknowledge an error                 | `error`              |
| Acknowledge no results               | `empty`              |

### Prefer semantic structure over flat layouts

Bad:
```json
{ "type": "stack", "children": [
  { "type": "text", "content": "Revenue" },
  { "type": "text", "content": "$84,200" },
  { "type": "text", "content": "+12%" }
]}
```

Good:
```json
{ "type": "metric", "label": "Revenue", "value": "$84,200", "delta": "+12%", "deltaVariant": "positive" }
```

Use `metric` for key-value stats, `badge` for status labels, `heading` for titles. Never use `text` when a more specific type applies.

### Choose context strategies deliberately

- `"context": "none"` — user clicked a tab, retried a request, submitted a stateless query. The next spec does not depend on what was previously rendered.
- `"context": "spec"` — the next response is a transformation of the current UI (expanding a card, comparing items in the current list, drilling into a selected row). Use this when the LLM needs to see the current state to produce a coherent next state.
- `"context": "custom"` — the application has richer context (e.g. user profile, database results) that is more useful than the raw spec JSON.

### Size actions to their scope

- A search input fires `llm` + `none`.
- A "View details" button fires `llm` + `spec` (the LLM needs to know which item was selected).
- Tab switching fires `local` (no LLM involved).
- Accordion toggle fires `local`.

### Validation belongs on every user-facing input

Always add a `validation` object to `input`, `select`, and `toggle` when the field has a constraint. Do not omit validation and rely on the host app to infer it.

### Every button needs an accessible label

If the button label is ambiguous out of context ("Go", ">", icon-only), add `"aria": { "label": "..." }` with a descriptive phrase.

### Clickable cards need a label too

```json
{
  "type": "card",
  "title": "Product name",
  "action": { "type": "llm", ... },
  "aria": { "label": "View details for Product name" }
}
```

### Use `delta` for change indicators

Instead of appending "+12%" to a metric value string, use the `delta` and `deltaVariant` fields. This lets the renderer style positive/negative changes correctly.

### Empty and error states are first-class

Return an `empty` component when there are no results. Return an `error` component when something failed. Never return an empty spec object or a `text` component that says "No results found."

---

## Common patterns

### Search results list

```json
{
  "genui": "1.0",
  "root": {
    "type": "section",
    "title": "Results for \"your query\"",
    "description": "3 matches",
    "aria": { "live": "polite" },
    "children": [
      {
        "type": "stack",
        "gap": "sm",
        "children": [
          {
            "type": "card",
            "title": "Result title",
            "description": "Short summary of the result.",
            "aria": { "label": "View Result title" },
            "action": { "type": "llm", "payload": { "id": "result-1", "intent": "view" }, "context": "none" }
          }
        ]
      }
    ]
  }
}
```

### Stat dashboard

```json
{
  "genui": "1.0",
  "root": {
    "type": "section",
    "title": "Q1 Summary",
    "children": [
      {
        "type": "grid",
        "columns": 3,
        "gap": "md",
        "children": [
          { "type": "metric", "label": "Revenue",   "value": "$84,200", "delta": "+12%", "deltaVariant": "positive" },
          { "type": "metric", "label": "Orders",    "value": "1,204",   "delta": "+8%",  "deltaVariant": "positive" },
          { "type": "metric", "label": "Churn",     "value": "2.1%",    "delta": "+0.3%","deltaVariant": "negative" }
        ]
      }
    ]
  }
}
```

### Confirmation dialog

```json
{
  "genui": "1.0",
  "root": {
    "type": "dialog",
    "title": "Delete item?",
    "description": "This action cannot be undone.",
    "actions": [
      {
        "type": "button",
        "label": "Cancel",
        "variant": "ghost",
        "action": { "type": "local", "event": "close-dialog" }
      },
      {
        "type": "button",
        "label": "Delete",
        "variant": "danger",
        "aria": { "label": "Confirm delete" },
        "action": { "type": "llm", "payload": { "intent": "confirm-delete" }, "context": "spec" }
      }
    ]
  }
}
```

### Multi-step form with tabs

```json
{
  "genui": "1.0",
  "root": {
    "type": "card",
    "title": "New project",
    "children": [
      {
        "type": "tabs",
        "items": [
          {
            "label": "Details",
            "children": [
              {
                "type": "form",
                "action": { "type": "llm", "payload": { "step": "details" }, "context": "none" },
                "children": [
                  { "type": "input", "name": "name",        "label": "Project name",   "validation": { "required": true } },
                  { "type": "input", "name": "description", "label": "Description",    "inputType": "text" }
                ]
              }
            ]
          },
          {
            "label": "Settings",
            "children": [
              {
                "type": "form",
                "action": { "type": "llm", "payload": { "step": "settings" }, "context": "spec" },
                "children": [
                  {
                    "type": "select",
                    "name": "visibility",
                    "label": "Visibility",
                    "options": [
                      { "value": "public",  "label": "Public" },
                      { "value": "private", "label": "Private" }
                    ]
                  },
                  { "type": "toggle", "name": "notifications", "label": "Email notifications" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Anti-patterns to avoid

| Anti-pattern | Fix |
|---|---|
| Returning plain text instead of a spec | Always return a JSON object with `genui` and `root` |
| Using `text` for numeric stats | Use `metric` |
| Using `text` for status labels | Use `badge` |
| Nesting `form` inside `form` | Use `tabs` or `accordion` for multi-step forms |
| Putting all content in one deep `stack` | Use `section`, `card`, `grid` to create visual hierarchy |
| Using `context: "spec"` for all actions | Only use it when the response depends on current screen state |
| Omitting `alt` on `image` | Always provide descriptive alt text |
| Using color names in variants ("blue") | Use semantic variants: "primary", "success", "danger" |
| Returning `{}` or `null` for no-result cases | Return `{ "type": "empty", "title": "..." }` |
