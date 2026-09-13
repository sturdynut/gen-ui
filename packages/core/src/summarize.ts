import type { Component, GenUIRoot } from './types';

/**
 * Produces a compact, human-readable description of a spec for use as
 * conversation history. Replaces multi-thousand-token JSON with ~20 tokens
 * while preserving enough context for the LLM to follow the conversation.
 */

type Bag = Record<string, unknown>;

function childrenOf(node: Bag): Component[] {
  const out: Component[] = [];

  const children = node['children'];
  if (Array.isArray(children)) {
    for (const c of children) if (c && typeof c === 'object') out.push(c as Component);
  }

  // list items are components or strings; tabs/accordion items wrap children
  const items = node['items'];
  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const bag = item as Bag;
      if (typeof bag['type'] === 'string') {
        out.push(item as Component);
      } else if (Array.isArray(bag['children'])) {
        for (const c of bag['children'] as unknown[]) {
          if (c && typeof c === 'object') out.push(c as Component);
        }
      }
    }
  }

  const actions = node['actions'];
  if (Array.isArray(actions)) {
    for (const a of actions) if (a && typeof a === 'object') out.push(a as Component);
  }

  return out;
}

export function summarizeSpec(spec: GenUIRoot): string {
  const counts = new Map<string, number>();
  let title: string | undefined;

  const walk = (node: Component | undefined, depth: number): void => {
    if (!node || typeof node !== 'object' || depth > 12) return;
    const bag = node as unknown as Bag;

    const type = bag['type'];
    if (typeof type === 'string') {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    if (title === undefined && typeof bag['title'] === 'string' && bag['title']) {
      title = bag['title'] as string;
    }

    for (const child of childrenOf(bag)) walk(child, depth + 1);
  };

  walk(spec.root, 0);

  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, n]) => (n > 1 ? `${n}×${type}` : type));

  const stateKeys = spec.state ? Object.keys(spec.state) : [];
  const stateNote = stateKeys.length > 0 ? `; state ${stateKeys.join(',')}` : '';
  const titleNote = title ? ` "${title}"` : '';

  return `[previously rendered${titleNote}: ${parts.join(', ')}${stateNote}]`;
}

/**
 * Summarizes a serialized spec. Falls back to a truncated string when the
 * content is not a parseable spec.
 */
export function summarizeSerializedSpec(json: string): string {
  try {
    const parsed = JSON.parse(json) as GenUIRoot;
    if (parsed && typeof parsed === 'object' && parsed.root) {
      return summarizeSpec(parsed);
    }
  } catch {
    /* fall through */
  }
  return json.length > 200 ? `${json.slice(0, 200)}…` : json;
}
