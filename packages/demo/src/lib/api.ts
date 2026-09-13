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
  onUsage?: (usage: StreamUsage) => void;
}

/** Token accounting for a single request, reported once the stream completes. */
export interface StreamUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUsd: number;
}

// Claude Sonnet 4.6 pricing, USD per million tokens.
const PRICE_INPUT = 3.0;
const PRICE_OUTPUT = 15.0;
const PRICE_CACHE_READ = 0.3;   // 0.1x base input
const PRICE_CACHE_WRITE = 3.75; // 1.25x base input, 5-minute TTL

export function estimateCost(u: Omit<StreamUsage, 'costUsd'>): number {
  return (
    (u.inputTokens * PRICE_INPUT +
      u.outputTokens * PRICE_OUTPUT +
      u.cacheReadTokens * PRICE_CACHE_READ +
      u.cacheCreationTokens * PRICE_CACHE_WRITE) /
    1_000_000
  );
}

// ─── Streaming ────────────────────────────────────────────────────────────────

/**
 * Marks the last message as a cache breakpoint, so everything before it
 * (system prompt + prior turns) can be served from cache on the next turn.
 *
 * The breakpoint goes on the last message rather than on the system block
 * because Sonnet 4.6 will not cache a prefix below 2048 tokens, and these
 * system prompts are ~1.3–1.7k on their own. Including the conversation is
 * what pushes the prefix over the line. Below the threshold the marker is a
 * silent no-op — nothing is cached and no write premium is charged.
 */
function withCacheBreakpoint(messages: ChatMessage[]): Anthropic.MessageParam[] {
  const lastIndex = messages.length - 1;

  return messages.map((message, i) => {
    if (i !== lastIndex) {
      return { role: message.role, content: message.content };
    }
    return {
      role: message.role,
      content: [
        {
          type: 'text' as const,
          text: message.content,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
    };
  });
}

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
  const { apiKey, systemPrompt, messages, onUsage } = options;

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: withCacheBreakpoint(messages),
  });

  // Input counts arrive on message_start; the final output count on message_delta.
  const tally = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    } else if (event.type === 'message_start') {
      const u = event.message.usage;
      tally.inputTokens = u.input_tokens ?? 0;
      tally.cacheReadTokens = u.cache_read_input_tokens ?? 0;
      tally.cacheCreationTokens = u.cache_creation_input_tokens ?? 0;
      tally.outputTokens = u.output_tokens ?? 0;
    } else if (event.type === 'message_delta') {
      tally.outputTokens = event.usage.output_tokens ?? tally.outputTokens;
    }
  }

  onUsage?.({ ...tally, costUsd: estimateCost(tally) });
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
