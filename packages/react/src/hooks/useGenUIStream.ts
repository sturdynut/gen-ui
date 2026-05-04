import { useState, useCallback, useRef } from 'react';
import { parseGenUIStream } from '@genui/core';
import type { GenUIRoot } from '@genui/core';

export type StreamStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface GenUIStreamState {
  status: StreamStatus;
  spec: GenUIRoot | null;
  error: string | null;
  buffer: string;
  /** Number of characters received so far */
  received: number;
}

export interface UseGenUIStreamReturn extends GenUIStreamState {
  /** Feed an AsyncIterable<string> (LLM stream) to be parsed. */
  consume: (stream: AsyncIterable<string>) => Promise<void>;
  /** Reset to idle state. */
  reset: () => void;
}

const idle: GenUIStreamState = {
  status: 'idle',
  spec: null,
  error: null,
  buffer: '',
  received: 0,
};

export function useGenUIStream(): UseGenUIStreamReturn {
  const [state, setState] = useState<GenUIStreamState>(idle);
  const abortRef = useRef(false);

  const consume = useCallback(async (stream: AsyncIterable<string>) => {
    abortRef.current = false;
    setState({ status: 'streaming', spec: null, error: null, buffer: '', received: 0 });

    for await (const event of parseGenUIStream(stream)) {
      if (abortRef.current) return;

      if (event.type === 'chunk') {
        setState(prev => ({
          ...prev,
          status: 'streaming',
          buffer: event.buffer,
          received: event.byteLength,
        }));
      } else if (event.type === 'complete') {
        setState({
          status: 'complete',
          spec: event.spec,
          error: null,
          buffer: '',
          received: 0,
        });
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: event.message,
          spec: null,
        }));
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState(idle);
  }, []);

  return { ...state, consume, reset };
}
