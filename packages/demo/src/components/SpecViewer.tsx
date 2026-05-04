import { useState } from 'react';
import type { GenUIRoot } from '@genui/core';

interface SpecViewerProps {
  spec: GenUIRoot | null;
}

export function SpecViewer({ spec }: SpecViewerProps) {
  const [open, setOpen] = useState(false);

  if (!spec) return null;

  return (
    <div className="spec-viewer">
      <button
        className="spec-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide JSON spec' : 'View JSON spec'}
      >
        {open ? '▲ Hide spec' : '▼ View spec JSON'}
      </button>
      {open && (
        <pre className="spec-pre" aria-label="GenUI JSON spec">
          {JSON.stringify(spec, null, 2)}
        </pre>
      )}
    </div>
  );
}
