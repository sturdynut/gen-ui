# GenUI

A JSON specification for describing user interfaces generatively. An LLM that knows the spec can produce valid GenUI JSON; any renderer that implements the spec can render it into native components.

## How it works

```
System prompt (spec) → LLM → GenUI JSON → Renderer SDK → UI
                                ↑                           |
                           onAction ←─────────────────────←┘
```

1. The spec is included in the LLM's system prompt.
2. The LLM responds with pure GenUI JSON — no prose, no markdown.
3. The renderer SDK parses the JSON stream and progressively renders components.
4. User interactions dispatch actions. `llm` actions call back to the LLM with an optional context payload; `local` actions are handled by the renderer with no round-trip.
5. The LLM returns a new GenUI JSON document. The renderer replaces the current UI.

The LLM is the reducer. The spec is the state shape. The renderer is the view.

## Repository layout

```
spec/
  SPEC.md            Human-readable specification
  schema.json        JSON Schema (draft-07) for validation
  system-prompt.md   Ready-to-use system prompt for LLMs
  examples/
    weather-card.json
    search-results.json
    contact-form.json

packages/            (coming soon)
  @genui/core        Framework-agnostic stream parser, validation, types
  @genui/react       React renderer
```

## Quick start

1. Copy the prompt block from [`spec/system-prompt.md`](spec/system-prompt.md) into your LLM system prompt.
2. Call your LLM. Parse the response as JSON.
3. Validate the `genui` version field.
4. Pass the object to `<GenUIRenderer>` from `@genui/react` (coming soon).

## Spec at a glance

```json
{
  "genui": "1.0",
  "root": {
    "type": "card",
    "title": "Hello",
    "children": [
      { "type": "text", "content": "World" },
      {
        "type": "button",
        "label": "Go deeper",
        "variant": "primary",
        "action": {
          "type": "llm",
          "payload": { "intent": "expand" },
          "context": "spec"
        }
      }
    ]
  }
}
```

Core component categories: **layout** (`stack`, `grid`, `section`), **content** (`text`, `heading`, `badge`, `metric`, `image`, `code`, `markdown`), **interactive** (`button`, `input`, `select`, `toggle`, `slider`, `form`), **composite** (`card`, `list`, `table`, `tabs`, `accordion`, `dialog`), **state** (`spinner`, `empty`, `error`).

Custom component types use an `x:` prefix and are registered with the renderer SDK.

## Actions

| Action type | When to use |
|-------------|-------------|
| `llm` + `context: "none"` | Stateless interactions — search, retry, simple navigation |
| `llm` + `context: "spec"` | The next response depends on what's currently on screen |
| `llm` + `context: "custom"` | Host app provides its own curated context |
| `local` | Pure UI interactions with no LLM round-trip (tab switching, accordion toggle) |

## Versioning

The `genui` field in every response carries the spec version. Renderers check this field and degrade gracefully: unknown minor versions render with best-effort; unknown major versions show an error fallback.

## Packages (roadmap)

| Package | Description |
|---------|-------------|
| `@genui/core` | TypeScript types, JSON Schema validator, streaming parser |
| `@genui/react` | React renderer + component registry |
| `@genui/vue` | Vue renderer |
| `@genui/angular` | Angular renderer |

## Contributing

See [`spec/SPEC.md`](spec/SPEC.md) for the full specification.
