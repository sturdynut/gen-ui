interface PromptChipsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function PromptChips({ prompts, onSelect, disabled }: PromptChipsProps) {
  return (
    <div className="prompt-chips" role="list" aria-label="Suggested prompts">
      {prompts.map(p => (
        <button
          key={p}
          role="listitem"
          className="prompt-chip"
          onClick={() => onSelect(p)}
          disabled={disabled}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
