import type { StreamUsage } from '../lib/api';
import type { SessionUsage } from '../hooks/useChat';

interface CostMeterProps {
  usage: StreamUsage | null;
  sessionUsage: SessionUsage;
}

function money(usd: number): string {
  if (usd === 0) return '$0';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

function tokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/**
 * Shows what the last request actually cost, and the running total.
 * Output tokens are billed at 5x input, so the split matters.
 */
export function CostMeter({ usage, sessionUsage }: CostMeterProps) {
  if (sessionUsage.requests === 0) return null;

  const cacheHit = usage != null && usage.cacheReadTokens > 0;

  return (
    <div className="cost-meter">
      <div className="cost-meter-row">
        <span className="cost-meter-label">Last request</span>
        {usage ? (
          <span className="cost-meter-value">{money(usage.costUsd)}</span>
        ) : (
          <span className="cost-meter-value cost-meter-free">cached · $0</span>
        )}
      </div>

      {usage && (
        <div className="cost-meter-bars">
          <span className="cost-chip" title="Input tokens billed at $3/M">
            in {tokens(usage.inputTokens)}
          </span>
          {usage.cacheReadTokens > 0 && (
            <span className="cost-chip cost-chip--cache" title="Cache reads billed at $0.30/M">
              cached {tokens(usage.cacheReadTokens)}
            </span>
          )}
          <span className="cost-chip cost-chip--out" title="Output tokens billed at $15/M">
            out {tokens(usage.outputTokens)}
          </span>
        </div>
      )}

      <div className="cost-meter-row cost-meter-row--total">
        <span className="cost-meter-label">
          Session · {sessionUsage.requests} request{sessionUsage.requests === 1 ? '' : 's'}
          {sessionUsage.cachedRequests > 0 && ` (${sessionUsage.cachedRequests} free)`}
        </span>
        <span className="cost-meter-value">{money(sessionUsage.costUsd)}</span>
      </div>

      {usage && !cacheHit && sessionUsage.requests > 1 && (
        <p className="cost-meter-note">
          No prefix cache hit — the prompt is under Sonnet&apos;s 2,048-token cache minimum.
        </p>
      )}
    </div>
  );
}
