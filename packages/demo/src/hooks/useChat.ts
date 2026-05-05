import { useState, useCallback } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
import { LRUCache } from '@genui/core';
import { callLLM, type ChatMessage } from '../lib/api';

export type ChatStatus = 'idle' | 'loading' | 'error';

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

// Module-level LRU cache — persists for the lifetime of the browser session.
// Keyed by a hash of the system prompt prefix + serialized message history.
const specCache = new LRUCache<string, GenUIRoot>(50);

function cacheKey(systemPrompt: string, messages: ChatMessage[]): string {
  // Use the first 80 chars of systemPrompt as a namespace, then full message history.
  return `${systemPrompt.slice(0, 80)}||${JSON.stringify(messages)}`;
}

export function useChat({ systemPrompt, apiKey }: UseChatOptions): UseChatReturn {
  const [spec, setSpec] = useState<GenUIRoot | null>(null);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const send = useCallback(
    async (userMessage: string) => {
      setStatus('loading');
      setError(null);
      setSpec(null);

      const nextHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: userMessage },
      ];
      setHistory(nextHistory);

      // Cache hit — skip the LLM entirely
      const key = cacheKey(systemPrompt, nextHistory);
      const cached = specCache.get(key);
      if (cached) {
        setSpec(cached);
        setStatus('idle');
        // Still record the assistant message so the history is consistent
        setHistory([
          ...nextHistory,
          { role: 'assistant', content: JSON.stringify(cached) },
        ]);
        return;
      }

      const result = await callLLM({ apiKey, systemPrompt, messages: nextHistory });

      if (result.ok) {
        const assistantContent = JSON.stringify(result.spec);
        const fullHistory: ChatMessage[] = [
          ...nextHistory,
          { role: 'assistant', content: assistantContent },
        ];
        setHistory(fullHistory);
        setSpec(result.spec);
        setStatus('idle');

        // Cache the result keyed by the history AFTER the assistant reply,
        // so repeated identical follow-ups also hit the cache.
        specCache.set(key, result.spec);
        specCache.set(cacheKey(systemPrompt, fullHistory), result.spec);
      } else {
        setError(result.errors[0] ?? 'Something went wrong');
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
    setSpec(null);
    setStatus('idle');
    setError(null);
    setHistory([]);
  }, []);

  return { spec, status, error, history, send, handleAction, reset };
}
