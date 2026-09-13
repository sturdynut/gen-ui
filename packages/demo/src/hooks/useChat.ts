import { useState, useCallback, useRef } from 'react';
import type { Action, GenUIRoot } from '@genui/core';
import {
  LRUCache,
  tryParsePartial,
  parseGenUIResponse,
  summarizeSerializedSpec,
} from '@genui/core';
import { streamFromAnthropic, type ChatMessage, type StreamUsage } from '../lib/api';

export type ChatStatus = 'idle' | 'streaming' | 'error';

export interface UseChatOptions {
  systemPrompt: string;
  apiKey: string;
}

/** Running total across every request made by this hook instance. */
export interface SessionUsage {
  requests: number;
  cachedRequests: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUsd: number;
}

const EMPTY_SESSION_USAGE: SessionUsage = {
  requests: 0,
  cachedRequests: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  costUsd: 0,
};

export interface UseChatReturn {
  spec: GenUIRoot | null;
  status: ChatStatus;
  error: string | null;
  history: ChatMessage[];
  usage: StreamUsage | null;
  sessionUsage: SessionUsage;
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

// Keep at most this many messages of context. Older turns are dropped entirely.
const MAX_HISTORY_MESSAGES = 8;

/**
 * Shrinks conversation history before it is sent to the API.
 *
 * A rendered spec is 1.5–4k tokens of JSON, and storing every one of them
 * verbatim makes each turn cost more than the last. The most recent spec is
 * kept in full so follow-ups like "make that table wider" still work; every
 * older one collapses to a ~20-token summary.
 */
function compressHistory(history: ChatMessage[]): ChatMessage[] {
  const windowed =
    history.length > MAX_HISTORY_MESSAGES
      ? history.slice(-MAX_HISTORY_MESSAGES)
      : history;

  // The API requires the first message to be from the user.
  const firstUser = windowed.findIndex(m => m.role === 'user');
  const trimmed = firstUser > 0 ? windowed.slice(firstUser) : windowed;

  const lastAssistant = trimmed.map(m => m.role).lastIndexOf('assistant');

  return trimmed.map((message, i) => {
    if (message.role !== 'assistant' || i === lastAssistant) return message;
    return { role: 'assistant', content: summarizeSerializedSpec(message.content) };
  });
}

function cacheKey(systemPrompt: string, messages: ChatMessage[]): string {
  return `${systemPrompt.slice(0, 80)}||${JSON.stringify(messages)}`;
}

export function useChat({ systemPrompt, apiKey }: UseChatOptions): UseChatReturn {
  const [spec, setSpec] = useState<GenUIRoot | null>(null);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [usage, setUsage] = useState<StreamUsage | null>(null);
  const [sessionUsage, setSessionUsage] = useState<SessionUsage>(EMPTY_SESSION_USAGE);

  const recordUsage = useCallback((u: StreamUsage) => {
    setUsage(u);
    setSessionUsage(prev => ({
      requests: prev.requests + 1,
      cachedRequests: prev.cachedRequests,
      inputTokens: prev.inputTokens + u.inputTokens,
      outputTokens: prev.outputTokens + u.outputTokens,
      cacheReadTokens: prev.cacheReadTokens + u.cacheReadTokens,
      costUsd: prev.costUsd + u.costUsd,
    }));
  }, []);

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

      // What actually goes over the wire — older specs collapsed to summaries.
      const requestMessages = compressHistory(nextHistory);

      // Cache hit — return instantly, no LLM call
      const key = cacheKey(systemPrompt, requestMessages);
      const cached = specCache.get(key);
      if (cached) {
        setSpec(cached);
        setStatus('idle');
        setHistory([
          ...nextHistory,
          { role: 'assistant', content: JSON.stringify(cached) },
        ]);
        setUsage(null);
        setSessionUsage(prev => ({
          ...prev,
          requests: prev.requests + 1,
          cachedRequests: prev.cachedRequests + 1,
        }));
        return;
      }

      // Stream from Anthropic, updating the rendered spec on each chunk
      let buffer = '';

      try {
        for await (const chunk of streamFromAnthropic({
          apiKey,
          systemPrompt,
          messages: requestMessages,
          onUsage: recordUsage,
        })) {
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

        // Cache under both the pre- and post-reply history keys. Both use the
        // compressed shape so later lookups can actually match.
        specCache.set(key, result.spec);
        specCache.set(cacheKey(systemPrompt, compressHistory(fullHistory)), result.spec);
      } else {
        setError(result.errors[0] ?? 'Invalid response from LLM');
        setStatus('error');
      }
    },
    [apiKey, history, systemPrompt, recordUsage]
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
    setUsage(null);
    setSessionUsage(EMPTY_SESSION_USAGE);
  }, []);

  return { spec, status, error, history, usage, sessionUsage, send, handleAction, reset };
}
