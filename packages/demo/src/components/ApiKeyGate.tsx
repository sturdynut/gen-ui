import { useState, type FormEvent } from 'react';

interface ApiKeyGateProps {
  onKey: (key: string) => void;
}

export function ApiKeyGate({ onKey }: ApiKeyGateProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key must start with sk-ant-');
      return;
    }
    onKey(trimmed);
  };

  return (
    <div className="gate-backdrop">
      <div className="gate-card">
        <div className="gate-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563eb"/>
            <rect x="8" y="8" width="7" height="7" rx="2" fill="white" opacity="0.9"/>
            <rect x="17" y="8" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
            <rect x="8" y="17" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
            <rect x="17" y="17" width="7" height="7" rx="2" fill="white" opacity="0.3"/>
          </svg>
          <span className="gate-logo-text">GenUI</span>
        </div>

        <h1 className="gate-title">Enter your Anthropic API key</h1>
        <p className="gate-subtitle">
          Your key is stored only in <code>localStorage</code> and sent directly to
          the Anthropic API via a serverless proxy. It is never logged or stored
          server-side.
        </p>

        <form onSubmit={handleSubmit} className="gate-form">
          <input
            type="password"
            className="gate-input"
            placeholder="sk-ant-..."
            value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            aria-label="Anthropic API key"
          />
          {error && <p className="gate-error" role="alert">{error}</p>}
          <button type="submit" className="gate-submit" disabled={!value.trim()}>
            Continue
          </button>
        </form>

        <p className="gate-footer">
          <a href="https://console.anthropic.com/keys" target="_blank" rel="noopener noreferrer">
            Get a key from console.anthropic.com →
          </a>
        </p>
      </div>
    </div>
  );
}
