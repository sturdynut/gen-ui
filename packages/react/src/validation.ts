import type { ValidationRules } from '@genui/core';

export function validateField(value: string, rules?: ValidationRules): string | null {
  if (!rules) return null;

  if (rules.required && !value.trim()) {
    return rules.message ?? 'This field is required.';
  }

  if (value) {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return rules.message ?? `Minimum ${rules.minLength} characters required.`;
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return rules.message ?? `Maximum ${rules.maxLength} characters allowed.`;
    }
    if (rules.min !== undefined && Number(value) < rules.min) {
      return rules.message ?? `Minimum value is ${rules.min}.`;
    }
    if (rules.max !== undefined && Number(value) > rules.max) {
      return rules.message ?? `Maximum value is ${rules.max}.`;
    }
    if (rules.pattern) {
      const error = rules.message ?? 'Invalid format.';
      if (rules.pattern === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return error;
      } else if (rules.pattern === 'url') {
        try { new URL(value); } catch { return error; }
      } else if (rules.pattern === 'phone') {
        if (!/^\+?[\d\s\-().]{7,}$/.test(value)) return error;
      } else if (rules.pattern.startsWith('/') && rules.pattern.length > 1) {
        // Custom regex: /pattern/flags
        const lastSlash = rules.pattern.lastIndexOf('/');
        const src = rules.pattern.slice(1, lastSlash);
        const flags = rules.pattern.slice(lastSlash + 1);
        try {
          if (!new RegExp(src, flags).test(value)) return error;
        } catch {
          // Malformed regex — skip validation
        }
      }
    }
  }

  return null;
}
