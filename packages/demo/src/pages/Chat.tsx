import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GenUIRenderer } from '@genui/react';
import { useChat } from '../hooks/useChat';
import { CHAT_PROMPT } from '../prompts';
import { SpecViewer } from '../components/SpecViewer';
import { PromptChips } from '../components/PromptChips';

const SUGGESTIONS = [
  'Show me a recipe for chocolate chip cookies',
  'Create a quiz about space exploration',
  'Help me plan a 3-day workout routine',
  'Compare React, Vue, and Angular in a table',
  'Build a simple to-do list UI',
  'Show me a weather card for Tokyo',
];

const WELCOME_SPEC = {
  genui: '2.0' as const,
  root: {
    type: 'stack' as const,
    gap: 'lg' as const,
    children: [
      {
        type: 'section' as const,
        title: 'Welcome to GenUI Chat',
        description: 'Ask anything — the LLM responds with a rich, interactive UI built from a JSON spec.',
        children: [
          {
            type: 'grid' as const,
            columns: 3,
            gap: 'md' as const,
            children: [
              {
                type: 'card' as const,
                title: '📊 Dashboard',
                description: 'Explore live business metrics with natural language.',
                action: { type: 'local' as const, event: 'navigate', target: '/dashboard' },
              },
              {
                type: 'card' as const,
                title: '🧙 Wizard',
                description: 'See multi-step forms driven entirely by client-side state — no LLM per step.',
                action: { type: 'local' as const, event: 'navigate', target: '/wizard' },
              },
              {
                type: 'card' as const,
                title: '💬 Chat',
                description: 'Open-ended chat — every reply is a fully interactive GenUI spec.',
                action: { type: 'local' as const, event: 'navigate', target: '/' },
              },
            ],
          },
        ],
      },
      {
        type: 'section' as const,
        title: 'How it works',
        children: [
          {
            type: 'accordion' as const,
            items: [
              {
                title: 'The LLM outputs JSON, not HTML',
                defaultOpen: true,
                children: [{
                  type: 'markdown' as const,
                  content: 'Every response is a **GenUI spec** — a structured JSON object describing component types, layout, content, and actions. The renderer turns that into real React components.',
                }],
              },
              {
                title: 'Spec streams progressively',
                children: [{
                  type: 'markdown' as const,
                  content: 'Tokens stream directly from the Anthropic API. A partial JSON parser closes open brackets on each chunk so the renderer shows content **as it arrives** — no spinner, just progressive disclosure.',
                }],
              },
              {
                title: 'State lives in the client, not the LLM',
                children: [{
                  type: 'markdown' as const,
                  content: 'The spec declares a `state` block and uses `visibleIf` + local reducers (`inc-state`, `set-state`) for navigation and toggles. **Zero LLM round-trips for UI state changes.**',
                }],
              },
            ],
          },
        ],
      },
    ],
  },
};

interface ChatProps {
  apiKey: string;
}

export function Chat({ apiKey }: ChatProps) {
  const navigate = useNavigate();
  const { spec, status, error, send, handleAction, reset } = useChat({
    systemPrompt: CHAT_PROMPT,
    apiKey,
  });
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const displaySpec = spec ?? WELCOME_SPEC;

  useEffect(() => {
    if (spec && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [spec]);

  const busy = status === 'streaming';

  const submit = async (message: string) => {
    if (!message.trim() || busy) return;
    setInput('');
    await send(message.trim());
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit(input);
    }
  };

  return (
    <div className="demo-layout">
      {/* Left panel — input */}
      <aside className="demo-sidebar">
        <div className="demo-sidebar-header">
          <h2 className="demo-sidebar-title">Chat</h2>
          <p className="demo-sidebar-desc">
            Ask anything. Every response streams in as a GenUI spec rendered in real time.
          </p>
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={busy}
            aria-label="Chat input"
          />
          <div className="chat-form-actions">
            <button
              type="submit"
              className="chat-send"
              disabled={!input.trim() || busy}
            >
              {busy ? 'Streaming…' : 'Send →'}
            </button>
            {spec && (
              <button type="button" className="chat-reset" onClick={reset}>
                Reset
              </button>
            )}
          </div>
        </form>

        {status === 'idle' && !spec && (
          <div className="demo-suggestions">
            <p className="demo-suggestions-label">Try one of these:</p>
            <PromptChips prompts={SUGGESTIONS} onSelect={s => void submit(s)} />
          </div>
        )}

        {error && (
          <div className="demo-error" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}
      </aside>

      {/* Right panel — output */}
      <div className="demo-output" ref={outputRef}>
        <div className="demo-output-header">
          <span className="demo-output-label">
            {busy
              ? <><span className="streaming-dot" aria-hidden="true" />{' Streaming…'}</>
              : spec
              ? '✓ GenUI spec rendered'
              : '← Send a message to generate UI'}
          </span>
        </div>

        <div className="demo-output-body">
          <GenUIRenderer
            spec={displaySpec}
            onAction={(action, formData, ctx) => {
              if (action.type === 'local' && action.event === 'navigate' && action.target) {
                navigate(action.target);
                return;
              }
              handleAction(action, formData, ctx);
            }}
          />
        </div>

        <SpecViewer spec={spec} />
      </div>
    </div>
  );
}
