import type { GenUIRoot } from './types';

// ─── Version check ────────────────────────────────────────────────────────────

export type VersionCheckResult =
  | { ok: true; version: string }
  | { ok: false; reason: 'missing' | 'unknown-major' | 'invalid-type'; version?: string };

export function checkVersion(genui: unknown): VersionCheckResult {
  if (genui === undefined || genui === null) {
    return { ok: false, reason: 'missing' };
  }
  if (typeof genui !== 'string') {
    return { ok: false, reason: 'invalid-type' };
  }
  const major = genui.split('.')[0];
  if (major !== '1') {
    return { ok: false, reason: 'unknown-major', version: genui };
  }
  return { ok: true, version: genui };
}

// ─── Spec validation ──────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true; spec: GenUIRoot }
  | { ok: false; errors: string[] };

export function validateSpec(obj: unknown): ValidationResult {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { ok: false, errors: ['Response must be a JSON object'] };
  }

  const record = obj as Record<string, unknown>;
  const errors: string[] = [];

  const versionResult = checkVersion(record['genui']);
  if (!versionResult.ok) {
    switch (versionResult.reason) {
      case 'missing':
        errors.push('Missing required field "genui"');
        break;
      case 'unknown-major':
        errors.push(
          `Unsupported spec version "${versionResult.version ?? ''}". This renderer supports GenUI 1.x.`
        );
        break;
      case 'invalid-type':
        errors.push('Field "genui" must be a string');
        break;
    }
  }

  if (record['root'] === undefined || record['root'] === null) {
    errors.push('Missing required field "root"');
  } else if (typeof record['root'] !== 'object' || Array.isArray(record['root'])) {
    errors.push('Field "root" must be a component object');
  } else {
    const root = record['root'] as Record<string, unknown>;
    if (typeof root['type'] !== 'string') {
      errors.push('Field "root.type" must be a string');
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, spec: obj as GenUIRoot };
}
