// Main renderer
export { GenUIRenderer } from './renderer';
export type { GenUIRendererProps } from './renderer';

// Registry
export { ComponentRegistry, defaultRegistry } from './registry';
export type { ExtensionProps, ExtensionRenderer } from './registry';

// Hooks
export { useGenUIStream } from './hooks/useGenUIStream';
export type { GenUIStreamState, StreamStatus, UseGenUIStreamReturn } from './hooks/useGenUIStream';
export { useStateValue } from './hooks/useStateValue';

// Context (for advanced use — building custom renderers)
export { GenUIContext, useGenUI } from './context';
export type { GenUIContextValue } from './context';

// Re-export everything from @genui/core for convenience
export * from '@genui/core';
