import { validateSpec, type ValidationResult } from './validate';
import type { GenUIRoot } from './types';

// ─── Stream events ────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: 'chunk'; buffer: string; byteLength: number }
  | { type: 'complete'; spec: GenUIRoot }
  | { type: 'error'; message: string; errors: string[]; raw?: string };

// ─── Streaming parser ─────────────────────────────────────────────────────────

/**
 * Consumes an async iterable of string chunks and yields StreamEvents.
 * Chunks are accumulated; on each chunk a partial parse is attempted so
 * callers can render progressively before the stream ends.
 */
export async function* parseGenUIStream(
  stream: AsyncIterable<string>
): AsyncGenerator<StreamEvent> {
  let buffer = '';

  try {
    for await (const chunk of stream) {
      buffer += chunk;
      yield { type: 'chunk', buffer, byteLength: buffer.length };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: 'error', message: `Stream error: ${message}`, errors: [message] };
    return;
  }

  yield* finalise(buffer);
}

/**
 * One-shot parse for non-streaming responses.
 */
export function parseGenUIResponse(text: string): ValidationResult {
  const trimmed = text.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, errors: ['Response is not valid JSON'] };
  }
  return validateSpec(parsed);
}

// ─── Partial JSON parser ──────────────────────────────────────────────────────

/**
 * Best-effort parser for incomplete JSON strings produced during LLM streaming.
 * Closes any unclosed strings, objects, and arrays to produce a parseable
 * JSON string, then validates it as a GenUIRoot.
 *
 * Returns null when:
 * - The buffer doesn't yet contain the opening `{`
 * - The partial result doesn't have at least `genui` + `root.type` fields
 */
export function tryParsePartial(text: string): GenUIRoot | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  const src = text.slice(start);

  // Try the full buffer as-is first (fast path for complete JSON)
  try {
    const r = JSON.parse(src);
    if (isMinimalSpec(r)) return r as GenUIRoot;
  } catch { /* fall through */ }

  // Walk the buffer tracking the nesting stack
  type Frame = '{' | '[' | '"';
  const stack: Frame[] = [];
  let i = 0;
  let escaped = false;

  while (i < src.length) {
    const c = src[i]!;

    if (escaped) {
      escaped = false;
      i++;
      continue;
    }

    if (stack[stack.length - 1] === '"') {
      if (c === '\\') escaped = true;
      else if (c === '"') stack.pop();
      i++;
      continue;
    }

    switch (c) {
      case '"': stack.push('"'); break;
      case '{': stack.push('{'); break;
      case '[': stack.push('['); break;
      case '}': if (stack[stack.length - 1] === '{') stack.pop(); break;
      case ']': if (stack[stack.length - 1] === '[') stack.pop(); break;
    }
    i++;
  }

  // Build the closing suffix in reverse stack order
  let suffix = '';
  for (let j = stack.length - 1; j >= 0; j--) {
    const frame = stack[j]!;
    if (frame === '"') suffix += '"';
    else if (frame === '{') suffix += '}';
    else if (frame === '[') suffix += ']';
  }

  // Strip trailing commas that would make the JSON invalid after closing
  const candidate = src.replace(/,(\s*)$/, '$1') + suffix;

  try {
    const r = JSON.parse(candidate);
    if (isMinimalSpec(r)) return r as GenUIRoot;
  } catch { /* not parseable yet */ }

  return null;
}

function isMinimalSpec(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o['genui'] === 'string' &&
    typeof o['root'] === 'object' &&
    o['root'] !== null &&
    typeof (o['root'] as Record<string, unknown>)['type'] === 'string'
  );
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function* finalise(buffer: string): Generator<StreamEvent> {
  const trimmed = buffer.trim();

  if (!trimmed) {
    yield {
      type: 'error',
      message: 'LLM returned an empty response',
      errors: ['Empty response'],
    };
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    yield {
      type: 'error',
      message: 'Response is not valid JSON',
      errors: ['Failed to parse JSON'],
      raw: trimmed,
    };
    return;
  }

  const result = validateSpec(parsed);
  if (result.ok) {
    yield { type: 'complete', spec: result.spec };
  } else {
    yield {
      type: 'error',
      message: result.errors[0] ?? 'Invalid GenUI spec',
      errors: result.errors,
      raw: trimmed,
    };
  }
}

// ─── Utility: adapt fetch ReadableStream ─────────────────────────────────────

export async function* readableStreamToIterable(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = stream.getReader();
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
