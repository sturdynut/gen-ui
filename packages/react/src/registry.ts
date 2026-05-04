import type { ComponentType } from 'react';
import type { ExtensionComponent } from '@genui/core';

export interface ExtensionProps {
  component: ExtensionComponent;
}

export type ExtensionRenderer = ComponentType<ExtensionProps>;

export class ComponentRegistry {
  private readonly map = new Map<string, ExtensionRenderer>();

  register(type: string, renderer: ExtensionRenderer): void {
    if (!type.startsWith('x:')) {
      throw new Error(
        `Extension component types must start with "x:". Received: "${type}"`
      );
    }
    this.map.set(type, renderer);
  }

  get(type: string): ExtensionRenderer | undefined {
    return this.map.get(type);
  }
}

export const defaultRegistry = new ComponentRegistry();
