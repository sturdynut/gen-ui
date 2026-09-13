/**
 * Screenshot harness — renders a representative GenUI spec through the real
 * @genui/react renderer, side by side with the JSON that produced it.
 * Not part of the shipped app; used to generate docs/screenshots/hero.png.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GenUIRenderer } from '@genui/react';
import type { GenUIRoot } from '@genui/core';
import '../../react/src/theme.css';
import './index.css';
import './hero.css';

const SPEC: GenUIRoot = {
  genui: '2.0',
  root: {
    type: 'section',
    title: 'Q4 Performance',
    description: 'Revenue softened against Q3 while customer health held steady.',
    children: [
      {
        type: 'grid',
        columns: 4,
        children: [
          { type: 'metric', label: 'Revenue', value: '$2.9M', delta: '-6.5% QoQ', deltaVariant: 'negative' },
          { type: 'metric', label: 'Orders', value: '1,389', delta: '-7.5% QoQ', deltaVariant: 'negative' },
          { type: 'metric', label: 'Avg Order', value: '$2,089', delta: '+1.2% QoQ', deltaVariant: 'positive' },
          { type: 'metric', label: 'NPS', value: '46', delta: '-2 pts', deltaVariant: 'neutral' },
        ],
      },
      {
        type: 'table',
        columns: [
          { key: 'product', label: 'Product' },
          { key: 'revenue', label: 'Annual Revenue' },
          { key: 'share', label: 'Share' },
        ],
        rows: [
          { product: 'Widget Pro', revenue: '$4.20M', share: '37%' },
          { product: 'Widget Lite', revenue: '$2.80M', share: '25%' },
          { product: 'Widget Mini', revenue: '$1.96M', share: '18%' },
          { product: 'Widget Plus', revenue: '$1.40M', share: '13%' },
        ],
      },
      {
        type: 'stack',
        direction: 'horizontal',
        gap: 'sm',
        children: [
          { type: 'badge', label: 'Churn 2.0% — on target', variant: 'success' },
          { type: 'badge', label: 'Revenue below plan', variant: 'warning' },
        ],
      },
      {
        type: 'stack',
        direction: 'horizontal',
        gap: 'sm',
        children: [
          {
            type: 'button',
            label: 'Drill into products',
            variant: 'primary',
            action: { type: 'llm', payload: { query: 'product breakdown' } },
          },
          {
            type: 'button',
            label: 'Compare regions',
            action: { type: 'llm', payload: { query: 'regional split' } },
          },
        ],
      },
    ],
  },
};

function Hero() {
  return (
    <div className="hero">
      <div className="hero-pane hero-pane--code">
        <div className="hero-pane-head">
          <span className="hero-dot hero-dot--json" />
          What the LLM emits
        </div>
        <div className="hero-code-wrap">
          <pre className="hero-code">{JSON.stringify(SPEC, null, 2)}</pre>
        </div>
      </div>
      <div className="hero-arrow" aria-hidden="true">→</div>
      <div className="hero-pane hero-pane--ui">
        <div className="hero-pane-head">
          <span className="hero-dot hero-dot--ui" />
          What the renderer shows
        </div>
        <div className="hero-ui-wrap">
          <div className="hero-ui">
            <GenUIRenderer spec={SPEC} onAction={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
  <StrictMode>
    <Hero />
  </StrictMode>
);
