import { describe, it, expect } from 'vitest';
import { normalizeStatusValue } from '../utils/status';

const OPTIONS = [
  { label: 'New', color: '#FCD34D', order: 0 },
  { label: 'Processing', color: '#60A5FA', order: 1 },
  { label: 'Settled', color: '#34D399', order: 2 },
  { label: 'Failed', color: '#F87171', order: 3 },
];

const ID_OPTIONS = [
  { label: 'Inquiry', color: '#94A3B8', order: 0, id: 'inquiry' },
  { label: 'Application', color: '#60A5FA', order: 1, id: 'application' },
  { label: 'Enrolled', color: '#34D399', order: 2, id: 'enrolled' },
];

describe('normalizeStatusValue', () => {
  // Slice 19.7 QA surfaced three historical seed shapes — the normalizer must
  // coerce all three to `{ label, color }` so downstream views (Table, Kanban,
  // Chart) don't silently drop items that seed with a non-canonical shape.

  it('returns null for null/undefined/empty values', () => {
    expect(normalizeStatusValue(null, OPTIONS)).toBeNull();
    expect(normalizeStatusValue(undefined, OPTIONS)).toBeNull();
    expect(normalizeStatusValue('', OPTIONS)).toBeNull();
  });

  it('passes through canonical { label, color } shape unchanged (MedVista pattern)', () => {
    const canonical = { label: 'Active', color: '#059669' };
    expect(normalizeStatusValue(canonical, OPTIONS)).toEqual({
      label: 'Active',
      color: '#059669',
    });
  });

  it('coerces plain-string value by looking up color from column options (NovaPay/JurisPath/TableSync pattern)', () => {
    expect(normalizeStatusValue('Settled', OPTIONS)).toEqual({
      label: 'Settled',
      color: '#34D399',
    });
  });

  it('plain-string value with no options array returns the string with a neutral color', () => {
    expect(normalizeStatusValue('Unknown', undefined)).toEqual({
      label: 'Unknown',
      color: '#6B7280',
    });
  });

  it('plain-string value whose label is not in options falls back to neutral color', () => {
    expect(normalizeStatusValue('Nonexistent', OPTIONS)).toEqual({
      label: 'Nonexistent',
      color: '#6B7280',
    });
  });

  it('coerces { labelId } by matching id → option (EduPulse/DentaFlow pattern)', () => {
    expect(normalizeStatusValue({ labelId: 'enrolled' }, ID_OPTIONS)).toEqual({
      label: 'Enrolled',
      color: '#34D399',
    });
  });

  it('coerces { labelId } by case-insensitive label match when no id is configured', () => {
    // Seeds like EduPulse's students ship labelId='inquiry' but the Column
    // options only carry `label`, not `id`. Match case-insensitively so the
    // Kanban lane still buckets correctly.
    const optsWithoutIds = [
      { label: 'Inquiry', color: '#94A3B8', order: 0 },
      { label: 'Enrolled', color: '#34D399', order: 1 },
    ];
    expect(normalizeStatusValue({ labelId: 'enrolled' }, optsWithoutIds)).toEqual({
      label: 'Enrolled',
      color: '#34D399',
    });
  });

  it('returns null for object values that carry neither label nor labelId', () => {
    expect(normalizeStatusValue({ foo: 'bar' }, OPTIONS)).toBeNull();
  });
});
