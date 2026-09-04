import Anthropic from '@anthropic-ai/sdk';
import { parseGenUIResponse, type ValidationResult } from '@genui/core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallLLMOptions {
  apiKey: string;
  systemPrompt: string;
  messages: ChatMessage[];
}

// ─── Streaming ────────────────────────────────────────────────────────────────

/**
 * Streams text tokens directly from the Anthropic API in the browser.
 * Yields raw text delta strings as they arrive.
 *
 * Bypasses the Netlify proxy — the user's own API key is used, which is
 * already stored client-side, so the security model is unchanged.
 */
export async function* streamFromAnthropic(
  options: CallLLMOptions
): AsyncGenerator<string> {
  const { apiKey, systemPrompt, messages } = options;

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: messages as Anthropic.MessageParam[],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

// ─── Non-streaming fallback (via Netlify function) ────────────────────────────

/**
 * One-shot call through the Netlify proxy. Used as a fallback when the
 * Anthropic SDK is not available or for server-key deployments.
 */
export async function callLLM(options: CallLLMOptions): Promise<ValidationResult> {
  const { apiKey, systemPrompt, messages } = options;

  let response: Response;
  try {
    response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-anthropic-key': apiKey,
      },
      body: JSON.stringify({ systemPrompt, messages }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, errors: [message] };
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) errorMessage = body.error;
    } catch { /* ignore */ }
    return { ok: false, errors: [errorMessage] };
  }

  const body = (await response.json()) as { text?: string; error?: string };

  if (body.error) return { ok: false, errors: [body.error] };

  return parseGenUIResponse(body.text ?? '');
}
