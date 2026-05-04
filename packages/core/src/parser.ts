import { validateSpec, type ValidationResult } from './validate';
import type { GenUIRoot } from './types';

// ─── Stream events ────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: 'chunk'; buffer: string; byteLength: number }
  | { type: 'complete'; spec: GenUIRoot }
  | { type: 'error'; message: string; errors: string[]; raw?: string };

// ─── Streaming parser ─────────────────────────────────────────────────────────

/**
 * Consumes an async iterable of string chunks (e.g. from the Anthropic SDK or
 * the OpenAI SDK streaming API) and yields StreamEvents.
 *
 * The LLM is expected to return a single JSON object as its entire response.
 * Chunks are accumulated until the stream ends, then parsed and validated.
 *
 * Usage:
 *   for await (const event of parseGenUIStream(stream)) {
 *     if (event.type === 'complete') render(event.spec);
 *     if (event.type === 'error')    showError(event.message);
 *   }
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

/**
 * Converts a web ReadableStream<Uint8Array> (e.g. from fetch()) into the
 * AsyncIterable<string> that parseGenUIStream expects.
 */
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
