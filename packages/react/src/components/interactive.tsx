import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';
import type {
  ButtonComponent, InputComponent, SelectComponent,
  ToggleComponent, SliderComponent, FormComponent, Component,
} from '@genui/core';
import { useGenUI } from '../context';
import { validateField } from '../validation';
import { renderComponent } from '../render';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps { component: ButtonComponent }
export function Button({ component }: ButtonProps) {
  const { onAction } = useGenUI();
  const { label, variant = 'default', size = 'md', disabled = false, action, id, aria } = component;

  return (
    <button
      id={id}
      type="button"
      className="genui-button"
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      aria-label={aria?.label ?? label}
      aria-describedby={aria?.describedby}
      onClick={() => !disabled && onAction(action)}
    >
      {label}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps { component: InputComponent }
export function Input({ component }: InputProps) {
  const { onAction, stateStore } = useGenUI();
  const {
    name, label, placeholder, inputType = 'text',
    value: defaultValue = '', validation, action, id, aria,
  } = component;
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = useCallback(() => {
    const err = validateField(value, validation);
    setError(err);
    if (err) return;

    if (!action) return;

    // local set-state → write to StateStore, no LLM
    if (action.type === 'local' && action.reducer === 'set-state' && action.path != null) {
      stateStore.set(action.path, value);
      return;
    }

    // llm action on a standalone input (outside a Form) → bubble to host
    if (action.type === 'llm') {
      onAction(action, { [name]: value });
    }
  }, [value, validation, action, name, onAction, stateStore]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error) setError(validateField(e.target.value, validation));
  }, [error, validation]);

  const inputId = id ?? `genui-input-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="genui-field">
      {label && <label htmlFor={inputId} className="genui-field__label">{label}</label>}
      <input
        id={inputId}
        name={name}
        type={inputType}
        className="genui-input-el"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={aria?.label ?? label}
        aria-describedby={error ? errorId : aria?.describedby}
        aria-invalid={error ? 'true' : undefined}
        aria-required={validation?.required ? 'true' : undefined}
      />
      {error && <span id={errorId} className="genui-field__error" role="alert">{error}</span>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps { component: SelectComponent }
export function Select({ component }: SelectProps) {
  const { onAction, stateStore } = useGenUI();
  const { name, label, options = [], value: defaultValue = '', validation, action, id, aria } = component;
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setValue(next);
    const err = validateField(next, validation);
    setError(err);
    if (err) return;

    if (!action) return;

    if (action.type === 'local' && action.reducer === 'set-state' && action.path != null) {
      stateStore.set(action.path, next);
      return;
    }

    if (action.type === 'llm') {
      onAction(action, { [name]: next });
    }
  }, [validation, action, name, onAction, stateStore]);

  const selectId = id ?? `genui-select-${name}`;
  const errorId = `${selectId}-error`;

  return (
    <div className="genui-field">
      {label && <label htmlFor={selectId} className="genui-field__label">{label}</label>}
      <select
        id={selectId}
        name={name}
        className="genui-select-el"
        value={value}
        onChange={handleChange}
        aria-label={aria?.label ?? label}
        aria-describedby={error ? errorId : aria?.describedby}
        aria-invalid={error ? 'true' : undefined}
        aria-required={validation?.required ? 'true' : undefined}
      >
        <option value="">Select…</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span id={errorId} className="genui-field__error" role="alert">{error}</span>}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps { component: ToggleComponent }
export function Toggle({ component }: ToggleProps) {
  const { onAction, stateStore } = useGenUI();
  const { name, label, checked: defaultChecked = false, action, id, aria } = component;
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setChecked(next);

    if (!action) return;

    if (action.type === 'local' && action.reducer === 'set-state' && action.path != null) {
      stateStore.set(action.path, next);
      return;
    }

    // toggle-state reducer
    if (action.type === 'local' && action.reducer === 'toggle-state' && action.path != null) {
      stateStore.toggle(action.path);
      return;
    }

    // llm action on standalone toggle → bubble
    if (action.type === 'llm') {
      onAction(action, { [name]: next });
    }
  }, [action, name, onAction, stateStore]);

  const toggleId = id ?? `genui-toggle-${name}`;

  return (
    <label className="genui-toggle" htmlFor={toggleId}>
      <input
        id={toggleId}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={handleChange}
        aria-label={aria?.label ?? label}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────

interface SliderProps { component: SliderComponent }
export function Slider({ component }: SliderProps) {
  const { onAction, stateStore } = useGenUI();
  const { name, label, min = 0, max = 100, step = 1, value: defaultValue, action, id, aria } = component;
  const [value, setValue] = useState(defaultValue ?? min);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  }, []);

  const handleRelease = useCallback(() => {
    if (!action) return;

    if (action.type === 'local' && action.reducer === 'set-state' && action.path != null) {
      stateStore.set(action.path, value);
      return;
    }

    if (action.type === 'llm') {
      onAction(action, { [name]: value });
    }
  }, [action, name, value, onAction, stateStore]);

  const sliderId = id ?? `genui-slider-${name}`;

  return (
    <div className="genui-slider">
      {label && <label htmlFor={sliderId} className="genui-field__label">{label}: {value}</label>}
      <input
        id={sliderId}
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        aria-label={aria?.label ?? label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="genui-slider__meta">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormProps { component: FormComponent }
export function Form({ component }: FormProps) {
  const { onAction } = useGenUI();
  const { children = [], submitLabel = 'Submit', validationStrategy = 'on-submit', action, id, aria } = component;

  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    formData.forEach((val, key) => { data[key] = val; });
    onAction(action, data);
  }, [action, onAction]);

  return (
    <form
      id={id}
      className="genui-form"
      onSubmit={handleSubmit}
      data-validation-strategy={validationStrategy}
      aria-label={aria?.label}
      noValidate
    >
      {children.map((child: Component, i) => renderComponent(child, i))}
      <button type="submit" className="genui-button" data-variant="primary" data-size="md">
        {submitLabel}
      </button>
    </form>
  );
}
