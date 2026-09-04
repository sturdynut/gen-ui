import { useState, useCallback, useRef } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
import { LRUCache, tryParsePartial, parseGenUIResponse } from '@genui/core';
import { streamFromAnthropic, type ChatMessage } from '../lib/api';

export type ChatStatus = 'idle' | 'streaming' | 'error';

export interface UseChatOptions {
  systemPrompt: string;
  apiKey: string;
}

export interface UseChatReturn {
  spec: GenUIRoot | null;
  status: ChatStatus;
  error: string | null;
  history: ChatMessage[];
  send: (userMessage: string) => Promise<void>;
  handleAction: (
    action: Action,
    formData?: Record<string, unknown>,
    contextPayload?: unknown
  ) => void;
  reset: () => void;
}

// Module-level LRU cache — persists for the browser session.
const specCache = new LRUCache<string, GenUIRoot>(50);

function cacheKey(systemPrompt: string, messages: ChatMessage[]): string {
  return `${systemPrompt.slice(0, 80)}||${JSON.stringify(messages)}`;
}

export function useChat({ systemPrompt, apiKey }: UseChatOptions): UseChatReturn {
  const [spec, setSpec] = useState<GenUIRoot | null>(null);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  // Ref to allow aborting in-flight streams on reset
  const abortRef = useRef<boolean>(false);

  const send = useCallback(
    async (userMessage: string) => {
      abortRef.current = false;
      setStatus('streaming');
      setError(null);
      setSpec(null);

      const nextHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: userMessage },
      ];
      setHistory(nextHistory);

      // Cache hit — return instantly, no LLM call
      const key = cacheKey(systemPrompt, nextHistory);
      const cached = specCache.get(key);
      if (cached) {
        setSpec(cached);
        setStatus('idle');
        setHistory([
          ...nextHistory,
          { role: 'assistant', content: JSON.stringify(cached) },
        ]);
        return;
      }

      // Stream from Anthropic, updating the rendered spec on each chunk
      let buffer = '';

      try {
        for await (const chunk of streamFromAnthropic({ apiKey, systemPrompt, messages: nextHistory })) {
          if (abortRef.current) return;
          buffer += chunk;

          // Try to render whatever partial JSON is available
          const partial = tryParsePartial(buffer);
          if (partial) setSpec(partial);
        }
      } catch (err) {
        if (abortRef.current) return;
        const message = err instanceof Error ? err.message : 'Stream error';
        setError(message);
        setStatus('error');
        return;
      }

      if (abortRef.current) return;

      // Final parse and validation on the complete buffer
      const result = parseGenUIResponse(buffer);

      if (result.ok) {
        setSpec(result.spec);
        setStatus('idle');

        const assistantContent = JSON.stringify(result.spec);
        const fullHistory: ChatMessage[] = [
          ...nextHistory,
          { role: 'assistant', content: assistantContent },
        ];
        setHistory(fullHistory);

        // Cache under both the pre- and post-reply history keys
        specCache.set(key, result.spec);
        specCache.set(cacheKey(systemPrompt, fullHistory), result.spec);
      } else {
        setError(result.errors[0] ?? 'Invalid response from LLM');
        setStatus('error');
      }
    },
    [apiKey, history, systemPrompt]
  );

  const handleAction = useCallback(
    (action: Action, formData?: Record<string, unknown>, contextPayload?: unknown) => {
      if (action.type !== 'llm') return;

      const payload: Record<string, unknown> = {
        ...(action.payload ?? {}),
        ...(formData ?? {}),
      };

      let userMessage: string;
      if (action.context === 'spec' && contextPayload) {
        userMessage = JSON.stringify({ action: payload, currentSpec: contextPayload });
      } else {
        userMessage = JSON.stringify(payload);
      }

      void send(userMessage);
    },
    [send]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setSpec(null);
    setStatus('idle');
    setError(null);
    setHistory([]);
  }, []);

  return { spec, status, error, history, send, handleAction, reset };
}
