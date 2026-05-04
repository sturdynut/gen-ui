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
    } catch {
      // ignore parse error
    }
    return { ok: false, errors: [errorMessage] };
  }

  const body = (await response.json()) as { text?: string; error?: string };

  if (body.error) {
    return { ok: false, errors: [body.error] };
  }

  return parseGenUIResponse(body.text ?? '');
}
