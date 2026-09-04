import { type FormEvent, useState } from 'react';
import { GenUIRenderer } from '@genui/react';
import { useChat } from '../hooks/useChat';
import { DASHBOARD_PROMPT } from '../prompts';
import { SpecViewer } from '../components/SpecViewer';
import { PromptChips } from '../components/PromptChips';

const SUGGESTIONS = [
  'Show me a Q4 performance summary',
  'Which products performed best this year?',
  'Compare revenue by region',
  'Show churn trends across all four quarters',
  'How is customer health trending?',
  'Give me an annual executive summary',
];

const WELCOME_SPEC = {
  genui: '2.0' as const,
  root: {
    type: 'section' as const,
    title: 'Acme Corp Analytics',
    description: 'Ask a question about the business in plain English. The AI generates a live dashboard.',
    children: [
      {
        type: 'grid' as const,
        columns: 4,
        gap: 'md' as const,
        children: [
          { type: 'metric' as const, label: 'Annual Revenue', value: '$11.2M', delta: '+14.3% YoY', deltaVariant: 'positive' as const },
          { type: 'metric' as const, label: 'Total Orders',   value: '5,482',  delta: '+11.2% YoY', deltaVariant: 'positive' as const },
          { type: 'metric' as const, label: 'Active Customers', value: '8,420' },
          { type: 'metric' as const, label: 'Avg NPS',        value: '45.3',   delta: '+7.9% YoY', deltaVariant: 'positive' as const },
        ],
      },
      {
        type: 'stack' as const,
        direction: 'horizontal' as const,
        gap: 'sm' as const,
        children: [
          {
            type: 'button' as const,
            label: 'Q4 Summary',
            variant: 'primary' as const,
            action: { type: 'llm' as const, payload: { query: 'Show me a Q4 performance summary dashboard' }, context: 'none' as const },
          },
          {
            type: 'button' as const,
            label: 'Product Breakdown',
            variant: 'default' as const,
            action: { type: 'llm' as const, payload: { query: 'Show me annual product revenue breakdown' }, context: 'none' as const },
          },
          {
            type: 'button' as const,
            label: 'Regional Split',
            variant: 'default' as const,
            action: { type: 'llm' as const, payload: { query: 'Show me revenue split by region with trends' }, context: 'none' as const },
          },
        ],
      },
    ],
  },
};

interface DashboardProps {
  apiKey: string;
}

export function Dashboard({ apiKey }: DashboardProps) {
  const { spec, status, error, send, handleAction, reset } = useChat({
    systemPrompt: DASHBOARD_PROMPT,
    apiKey,
  });
  const [input, setInput] = useState('');

  const displaySpec = spec ?? WELCOME_SPEC;

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

  return (
    <div className="demo-layout">
      {/* Left panel */}
      <aside className="demo-sidebar">
        <div className="demo-sidebar-header">
          <h2 className="demo-sidebar-title">Data Dashboard</h2>
          <p className="demo-sidebar-desc">
            Ask questions about Acme Corp's business data in plain English. The LLM generates
            a dashboard-style GenUI spec with metrics, tables, and badges.
          </p>
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            placeholder="e.g. Show me Q3 revenue breakdown…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit(input); } }}
            rows={3}
            disabled={busy}
            aria-label="Dashboard query"
          />
          <div className="chat-form-actions">
            <button type="submit" className="chat-send" disabled={!input.trim() || busy}>
              {busy ? 'Streaming…' : 'Query →'}
            </button>
            {spec && <button type="button" className="chat-reset" onClick={reset}>Reset</button>}
          </div>
        </form>

        <div className="demo-suggestions">
          <p className="demo-suggestions-label">Try asking:</p>
          <PromptChips prompts={SUGGESTIONS} onSelect={s => void submit(s)} disabled={busy} />
        </div>

        {error && <div className="demo-error" role="alert"><strong>Error:</strong> {error}</div>}

        <div className="demo-data-note">
          <p className="demo-data-note-label">📋 Data context</p>
          <p>Annual revenue, quarterly orders, product mix, regional splits, churn, NPS, and support data for Acme Corp are embedded in the system prompt.</p>
        </div>
      </aside>

      {/* Right panel */}
      <div className="demo-output">
        <div className="demo-output-header">
          <span className="demo-output-label">
            {busy
              ? <><span className="streaming-dot" aria-hidden="true" />{' Streaming dashboard…'}</>
              : spec ? '✓ Dashboard rendered' : '← Run a query to see your dashboard'}
          </span>
        </div>

        <div className="demo-output-body">
          <GenUIRenderer spec={displaySpec} onAction={handleAction} />
        </div>

        <SpecViewer spec={spec} />
      </div>
    </div>
  );
}
