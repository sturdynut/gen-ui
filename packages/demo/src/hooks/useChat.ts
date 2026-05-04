import { useState, useCallback } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
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

      const result = await callLLM({ apiKey, systemPrompt, messages: nextHistory });

      if (result.ok) {
        // Store the raw JSON string as the assistant message so the LLM
        // sees its own previous outputs in context
        const assistantContent = JSON.stringify(result.spec);
        setHistory([...nextHistory, { role: 'assistant', content: assistantContent }]);
        setSpec(result.spec);
        setStatus('idle');
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

      // Build a user message from the action payload + form data + context
      const payload: Record<string, unknown> = {
        ...(action.payload ?? {}),
        ...(formData ?? {}),
      };

      let userMessage: string;

      if (action.context === 'spec' && contextPayload) {
        // Include the current spec in the message so the LLM can see the full state
        userMessage = JSON.stringify({
          action: payload,
          currentSpec: contextPayload,
        });
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
