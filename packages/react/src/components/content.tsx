import type {
  TextComponent, HeadingComponent, BadgeComponent, MetricComponent,
  ImageComponent, DividerComponent, CodeComponent, MarkdownComponent,
} from '@genui/core';

interface TextProps { component: TextComponent }
export function Text({ component }: TextProps) {
  const { content, variant = 'default', id, aria } = component;
  return (
    <p
      id={id}
      className="genui-text"
      data-variant={variant}
      aria-label={aria?.label}
      aria-live={aria?.live}
    >
      {content}
    </p>
  );
}

interface HeadingProps { component: HeadingComponent }
export function Heading({ component }: HeadingProps) {
  const { content, level = 2, id, aria } = component;
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <Tag
      id={id}
      className="genui-heading"
      data-level={level}
      aria-label={aria?.label}
    >
      {content}
    </Tag>
  );
}

interface BadgeProps { component: BadgeComponent }
export function Badge({ component }: BadgeProps) {
  const { label, variant = 'default', id, aria } = component;
  return (
    <span
      id={id}
      className="genui-badge"
      data-variant={variant}
      aria-label={aria?.label ?? label}
    >
      {label}
    </span>
  );
}

interface MetricProps { component: MetricComponent }
export function Metric({ component }: MetricProps) {
  const { label, value, delta, deltaVariant = 'neutral', id, aria } = component;
  return (
    <div id={id} className="genui-metric" aria-label={aria?.label ?? `${label}: ${value}`}>
      <span className="genui-metric__label">{label}</span>
      <span className="genui-metric__value">{value}</span>
      {delta && (
        <span className="genui-metric__delta" data-variant={deltaVariant} aria-label={`Change: ${delta}`}>
          {delta}
        </span>
      )}
    </div>
  );
}

interface ImageProps { component: ImageComponent }
export function Image({ component }: ImageProps) {
  const { src, alt, caption, id, aria } = component;
  return (
    <figure id={id} className="genui-image">
      <img src={src} alt={alt} aria-describedby={aria?.describedby} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

interface DividerProps { component: DividerComponent }
export function Divider({ component }: DividerProps) {
  return <hr id={component.id} className="genui-divider" role="separator" />;
}

interface CodeProps { component: CodeComponent }
export function Code({ component }: CodeProps) {
  const { content, language, id, aria } = component;
  return (
    <pre id={id} className="genui-code" aria-label={aria?.label}>
      {language && <span className="genui-code__lang">{language}</span>}
      <code>{content}</code>
    </pre>
  );
}

// Minimal inline markdown renderer — no external dependency.
// Supports: **bold**, *italic*, `code`, [text](url), paragraphs.
function renderMarkdown(md: string): string {
  return md
    .split(/\n\n+/)
    .map(para =>
      `<p>${para
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
        .replace(/\n/g, '<br>')
      }</p>`
    )
    .join('');
}

interface MarkdownProps { component: MarkdownComponent }
export function Markdown({ component }: MarkdownProps) {
  const { content, id, aria } = component;
  return (
    <div
      id={id}
      className="genui-markdown"
      aria-label={aria?.label}
      aria-live={aria?.live}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
