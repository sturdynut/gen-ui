// ─── Primitives ──────────────────────────────────────────────────────────────

export type Gap = 'none' | 'sm' | 'md' | 'lg';
export type Variant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type Size = 'sm' | 'md' | 'lg';
export type DeltaVariant = 'positive' | 'negative' | 'neutral';
export type InputType = 'text' | 'email' | 'number' | 'password' | 'tel' | 'url';
export type Align = 'start' | 'center' | 'end' | 'stretch';
export type ValidationStrategy = 'on-submit' | 'on-blur' | 'on-change';
export type ContextStrategy = 'none' | 'spec' | 'custom';
export type TextVariant = 'default' | 'muted' | 'strong' | 'emphasis';
export type LiveRegion = 'polite' | 'assertive';

// ─── Shared sub-objects ───────────────────────────────────────────────────────

export interface AriaProps {
  label?: string;
  describedby?: string;
  role?: string;
  live?: LiveRegion;
}

export interface LlmAction {
  type: 'llm';
  payload?: Record<string, unknown>;
  context?: ContextStrategy;
}

export interface LocalAction {
  type: 'local';
  event: string;
  target?: string;
}

export type Action = LlmAction | LocalAction;

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** "email" | "url" | "phone" | "/regex/" */
  pattern?: string;
  message?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

export interface TabItem {
  label: string;
  children: Component[];
}

export interface AccordionItem {
  title: string;
  defaultOpen?: boolean;
  children: Component[];
}

// ─── Base ─────────────────────────────────────────────────────────────────────

interface BaseComponent {
  id?: string;
  aria?: AriaProps;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface StackComponent extends BaseComponent {
  type: 'stack';
  direction?: 'vertical' | 'horizontal';
  gap?: Gap;
  align?: Align;
  children: Component[];
}

export interface GridComponent extends BaseComponent {
  type: 'grid';
  columns?: number | 'auto';
  gap?: Gap;
  children: Component[];
}

export interface SectionComponent extends BaseComponent {
  type: 'section';
  title?: string;
  description?: string;
  children: Component[];
}

// ─── Content ──────────────────────────────────────────────────────────────────

export interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  variant?: TextVariant;
}

export interface HeadingComponent extends BaseComponent {
  type: 'heading';
  content: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface BadgeComponent extends BaseComponent {
  type: 'badge';
  label: string;
  variant?: Variant;
}

export interface MetricComponent extends BaseComponent {
  type: 'metric';
  label: string;
  value: string | number;
  delta?: string;
  deltaVariant?: DeltaVariant;
}

export interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface DividerComponent extends BaseComponent {
  type: 'divider';
}

export interface CodeComponent extends BaseComponent {
  type: 'code';
  content: string;
  language?: string;
}

export interface MarkdownComponent extends BaseComponent {
  type: 'markdown';
  content: string;
}

// ─── Interactive ──────────────────────────────────────────────────────────────

export interface ButtonComponent extends BaseComponent {
  type: 'button';
  label: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  action: Action;
}

export interface InputComponent extends BaseComponent {
  type: 'input';
  name: string;
  label?: string;
  placeholder?: string;
  inputType?: InputType;
  value?: string;
  validation?: ValidationRules;
  action?: Action;
}

export interface SelectComponent extends BaseComponent {
  type: 'select';
  name: string;
  label?: string;
  options: SelectOption[];
  value?: string;
  validation?: ValidationRules;
  action?: Action;
}

export interface ToggleComponent extends BaseComponent {
  type: 'toggle';
  name: string;
  label?: string;
  checked?: boolean;
  validation?: ValidationRules;
  action?: Action;
}

export interface SliderComponent extends BaseComponent {
  type: 'slider';
  name: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  action?: Action;
}

export interface FormComponent extends BaseComponent {
  type: 'form';
  children: Component[];
  submitLabel?: string;
  validationStrategy?: ValidationStrategy;
  action: Action;
}

// ─── Composite ────────────────────────────────────────────────────────────────

export interface CardComponent extends BaseComponent {
  type: 'card';
  title?: string;
  description?: string;
  children?: Component[];
  action?: Action;
}

export interface ListComponent extends BaseComponent {
  type: 'list';
  ordered?: boolean;
  items: (Component | string)[];
}

export interface TableComponent extends BaseComponent {
  type: 'table';
  columns: TableColumn[];
  rows: Record<string, string | number>[];
  action?: Action;
}

export interface TabsComponent extends BaseComponent {
  type: 'tabs';
  defaultTab?: number;
  items: TabItem[];
}

export interface AccordionComponent extends BaseComponent {
  type: 'accordion';
  items: AccordionItem[];
}

export interface DialogComponent extends BaseComponent {
  type: 'dialog';
  title?: string;
  description?: string;
  children?: Component[];
  actions?: ButtonComponent[];
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface SpinnerComponent extends BaseComponent {
  type: 'spinner';
  label?: string;
}

export interface EmptyComponent extends BaseComponent {
  type: 'empty';
  title: string;
  description?: string;
  action?: Action;
}

export interface ErrorComponent extends BaseComponent {
  type: 'error';
  title: string;
  description?: string;
  action?: Action;
}

// ─── Extension ────────────────────────────────────────────────────────────────

export interface ExtensionComponent extends BaseComponent {
  type: `x:${string}`;
  props?: Record<string, unknown>;
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type Component =
  | StackComponent
  | GridComponent
  | SectionComponent
  | TextComponent
  | HeadingComponent
  | BadgeComponent
  | MetricComponent
  | ImageComponent
  | DividerComponent
  | CodeComponent
  | MarkdownComponent
  | ButtonComponent
  | InputComponent
  | SelectComponent
  | ToggleComponent
  | SliderComponent
  | FormComponent
  | CardComponent
  | ListComponent
  | TableComponent
  | TabsComponent
  | AccordionComponent
  | DialogComponent
  | SpinnerComponent
  | EmptyComponent
  | ErrorComponent
  | ExtensionComponent;

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface GenUIRoot {
  /** Semver string, always a 1.x value in this renderer generation */
  genui: string;
  root: Component;
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isExtensionComponent(c: Component): c is ExtensionComponent {
  return c.type.startsWith('x:');
}

export function isLlmAction(a: Action): a is LlmAction {
  return a.type === 'llm';
}

export function isLocalAction(a: Action): a is LocalAction {
  return a.type === 'local';
}
