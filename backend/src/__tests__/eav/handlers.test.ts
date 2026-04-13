/**
 * Comprehensive tests for all 15 EAV column type handlers.
 * Pure-function tests — no database, no mocks needed.
 */

import { getHandler, getColumnTypes, getAllHandlers } from '../../eav';

describe('EAV Column Type Handlers', () => {
  // ─── Registry ─────────────────────────────────────────────────────────────────

  describe('Registry', () => {
    it('registers all 15 column types', () => {
      const types = getColumnTypes();
      expect(types).toHaveLength(15);
      expect(types).toEqual(
        expect.arrayContaining([
          'status', 'text', 'long_text', 'number', 'date',
          'person', 'email', 'phone', 'dropdown', 'checkbox',
          'url', 'files', 'formula', 'timeline', 'rating',
        ])
      );
    });

    it('getHandler throws for unknown type', () => {
      expect(() => getHandler('nonexistent')).toThrow('Unknown column type: nonexistent');
    });

    it('getColumnTypes returns all type names', () => {
      const types = getColumnTypes();
      expect(Array.isArray(types)).toBe(true);
      for (const t of types) {
        expect(typeof t).toBe('string');
        expect(() => getHandler(t)).not.toThrow();
      }
    });

    it('getAllHandlers returns a Map of handler instances', () => {
      const handlers = getAllHandlers();
      expect(handlers).toBeInstanceOf(Map);
      expect(handlers.size).toBe(15);
      for (const [key, handler] of handlers) {
        expect(handler.type).toBe(key);
        expect(typeof handler.label).toBe('string');
        expect(typeof handler.icon).toBe('string');
      }
    });
  });

  // ─── StatusHandler ────────────────────────────────────────────────────────────

  describe('StatusHandler', () => {
    const handler = getHandler('status');

    it('validates a status object with label and color', () => {
      const result = handler.validate({ label: 'Done', color: '#00c875' });
      expect(result.valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-object values', () => {
      const result = handler.validate('Done');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/object/i);
    });

    it('rejects objects missing label or color', () => {
      expect(handler.validate({ label: 'Done' }).valid).toBe(false);
      expect(handler.validate({ color: '#00c875' }).valid).toBe(false);
    });

    it('validates against config labels when provided', () => {
      const config = {
        labels: [
          { label: 'Done', color: '#00c875' },
          { label: 'Working', color: '#fdab3d' },
        ],
      };
      expect(handler.validate({ label: 'Done', color: '#00c875' }, config).valid).toBe(true);
      const invalid = handler.validate({ label: 'Invalid', color: '#000' }, config);
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toMatch(/Invalid status label/);
    });

    it('serializes status object', () => {
      expect(handler.serialize({ label: 'Done', color: '#00c875' })).toEqual({
        label: 'Done',
        color: '#00c875',
      });
      expect(handler.serialize(null)).toBeNull();
    });

    it('deserializes status object', () => {
      const result = handler.deserialize({ label: 'Done', color: '#00c875' });
      expect(result).toEqual({ label: 'Done', color: '#00c875' });
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display value', () => {
      expect(handler.formatDisplay({ label: 'Done', color: '#00c875' })).toBe('Done');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns count aggregates per status label', () => {
      const values = [
        { label: 'Done', color: '#00c875' },
        { label: 'Done', color: '#00c875' },
        { label: 'Working', color: '#fdab3d' },
        null,
      ];
      const aggs = handler.getAggregates(values);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 3 },
          { type: 'status:Done', value: 2 },
          { type: 'status:Working', value: 1 },
        ])
      );
    });
  });

  // ─── TextHandler ──────────────────────────────────────────────────────────────

  describe('TextHandler', () => {
    const handler = getHandler('text');

    it('validates strings', () => {
      expect(handler.validate('hello').valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-string values', () => {
      expect(handler.validate(123).valid).toBe(false);
      expect(handler.validate(true).valid).toBe(false);
      expect(handler.validate({}).valid).toBe(false);
    });

    it('rejects strings exceeding maxLength from config', () => {
      const config = { maxLength: 5 };
      expect(handler.validate('123456', config).valid).toBe(false);
      expect(handler.validate('12345', config).valid).toBe(true);
    });

    it('uses default maxLength of 1000', () => {
      const long = 'a'.repeat(1001);
      expect(handler.validate(long).valid).toBe(false);
      expect(handler.validate('a'.repeat(1000)).valid).toBe(true);
    });

    it('serializes and deserializes text', () => {
      expect(handler.serialize('hello')).toBe('hello');
      expect(handler.serialize(null)).toBeNull();
      expect(handler.deserialize('hello')).toBe('hello');
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display value', () => {
      expect(handler.formatDisplay('hello')).toBe('hello');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns count aggregate for non-empty values', () => {
      const aggs = handler.getAggregates(['a', 'b', '', null, undefined]);
      expect(aggs).toEqual([{ type: 'count', value: 2 }]);
    });
  });

  // ─── NumberHandler ────────────────────────────────────────────────────────────

  describe('NumberHandler', () => {
    const handler = getHandler('number');

    it('validates numbers', () => {
      expect(handler.validate(42).valid).toBe(true);
      expect(handler.validate(3.14).valid).toBe(true);
      expect(handler.validate(0).valid).toBe(true);
    });

    it('validates numeric strings', () => {
      expect(handler.validate('42').valid).toBe(true);
      expect(handler.validate('3.14').valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-numeric values', () => {
      expect(handler.validate('abc').valid).toBe(false);
      expect(handler.validate(true).valid).toBe(false);
    });

    it('validates against min/max config', () => {
      const config = { min: 0, max: 100 };
      expect(handler.validate(50, config).valid).toBe(true);
      expect(handler.validate(-1, config).valid).toBe(false);
      expect(handler.validate(101, config).valid).toBe(false);
    });

    it('serializes to number', () => {
      expect(handler.serialize(42)).toBe(42);
      expect(handler.serialize('3.14')).toBe(3.14);
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize('abc')).toBeNull();
    });

    it('deserializes from JSON', () => {
      expect(handler.deserialize(42)).toBe(42);
      expect(handler.deserialize('3.14')).toBe(3.14);
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display with prefix/suffix/unit', () => {
      const config = { prefix: '$', suffix: '', unit: 'USD', decimals: 2 };
      const display = handler.formatDisplay(1234.5, config);
      expect(display).toContain('$');
      expect(display).toContain('USD');
      expect(display).toContain('1,234.50');
    });

    it('formats display with no config', () => {
      expect(handler.formatDisplay(42)).toBe('42');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns sum/avg/min/max aggregates', () => {
      const aggs = handler.getAggregates([10, 20, 30]);
      expect(aggs).toEqual([
        { type: 'count', value: 3 },
        { type: 'sum', value: 60 },
        { type: 'avg', value: 20 },
        { type: 'min', value: 10 },
        { type: 'max', value: 30 },
      ]);
    });

    it('returns null aggregates for empty values', () => {
      const aggs = handler.getAggregates([]);
      expect(aggs).toEqual([
        { type: 'count', value: 0 },
        { type: 'sum', value: null },
        { type: 'avg', value: null },
        { type: 'min', value: null },
        { type: 'max', value: null },
      ]);
    });

    it('rounds avg and sum to 2 decimal places', () => {
      const aggs = handler.getAggregates([1, 2, 3]);
      const avg = aggs.find(a => a.type === 'avg');
      expect(avg!.value).toBe(2);
    });
  });

  // ─── DateHandler ──────────────────────────────────────────────────────────────

  describe('DateHandler', () => {
    const handler = getHandler('date');

    it('validates ISO date strings', () => {
      expect(handler.validate('2024-01-15').valid).toBe(true);
      expect(handler.validate('2024-01-15T10:30:00.000Z').valid).toBe(true);
    });

    it('accepts null/undefined/empty as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(handler.validate('not-a-date').valid).toBe(false);
      expect(handler.validate('2024-13-45').valid).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(handler.validate(12345).valid).toBe(false);
      expect(handler.validate(true).valid).toBe(false);
    });

    it('serializes date string to ISO format', () => {
      const result = handler.serialize('2024-01-15');
      expect(result).toMatch(/2024-01-15/);
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize('')).toBeNull();
    });

    it('deserializes date from JSON', () => {
      expect(handler.deserialize('2024-01-15T00:00:00.000Z')).toBe('2024-01-15T00:00:00.000Z');
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats date for display', () => {
      const display = handler.formatDisplay('2024-01-15T00:00:00.000Z');
      expect(display).toBe('Jan 15, 2024');
    });

    it('formats date with time when includeTime config is set', () => {
      const display = handler.formatDisplay('2024-01-15T10:30:00.000Z', { includeTime: true });
      expect(display).toBe('Jan 15, 2024 10:30');
    });

    it('returns earliest/latest aggregates', () => {
      const values = ['2024-01-01T00:00:00.000Z', '2024-06-15T00:00:00.000Z', '2024-03-10T00:00:00.000Z'];
      const aggs = handler.getAggregates(values);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 3 },
          { type: 'earliest', value: '2024-01-01T00:00:00.000Z' },
          { type: 'latest', value: '2024-06-15T00:00:00.000Z' },
        ])
      );
    });

    it('returns null earliest/latest for empty array', () => {
      const aggs = handler.getAggregates([]);
      expect(aggs).toEqual([
        { type: 'count', value: 0 },
        { type: 'earliest', value: null },
        { type: 'latest', value: null },
      ]);
    });
  });

  // ─── EmailHandler ─────────────────────────────────────────────────────────────

  describe('EmailHandler', () => {
    const handler = getHandler('email');

    it('validates email format', () => {
      expect(handler.validate('user@example.com').valid).toBe(true);
      expect(handler.validate('user+tag@domain.co.uk').valid).toBe(true);
    });

    it('accepts null/undefined/empty as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(handler.validate('not-an-email').valid).toBe(false);
      expect(handler.validate('missing@').valid).toBe(false);
      expect(handler.validate('@domain.com').valid).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(handler.validate(123).valid).toBe(false);
    });

    it('serializes email to lowercase trimmed string', () => {
      expect(handler.serialize('User@Example.COM')).toBe('user@example.com');
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize('')).toBeNull();
    });

    it('deserializes email string', () => {
      expect(handler.deserialize('user@example.com')).toBe('user@example.com');
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display value', () => {
      expect(handler.formatDisplay('user@example.com')).toBe('user@example.com');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns count aggregate', () => {
      const aggs = handler.getAggregates(['a@b.com', 'c@d.com', '', null]);
      expect(aggs).toEqual([{ type: 'count', value: 2 }]);
    });
  });

  // ─── PhoneHandler ─────────────────────────────────────────────────────────────

  describe('PhoneHandler', () => {
    const handler = getHandler('phone');

    it('validates phone strings', () => {
      expect(handler.validate('+1 (555) 123-4567').valid).toBe(true);
      expect(handler.validate('555-123-4567').valid).toBe(true);
      expect(handler.validate('+44 20 7946 0958').valid).toBe(true);
    });

    it('accepts null/undefined/empty as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('rejects non-string values', () => {
      expect(handler.validate(1234567890).valid).toBe(false);
    });

    it('rejects invalid phone formats', () => {
      expect(handler.validate('abc').valid).toBe(false);
      expect(handler.validate('12').valid).toBe(false);
    });

    it('serializes phone string trimmed', () => {
      expect(handler.serialize('  555-123-4567  ')).toBe('555-123-4567');
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize('')).toBeNull();
    });

    it('deserializes phone string', () => {
      expect(handler.deserialize('555-123-4567')).toBe('555-123-4567');
      expect(handler.deserialize(null)).toBeNull();
    });

    it('returns count aggregate', () => {
      const aggs = handler.getAggregates(['555-1234', '555-5678', null, '']);
      expect(aggs).toEqual([{ type: 'count', value: 2 }]);
    });
  });

  // ─── CheckboxHandler ──────────────────────────────────────────────────────────

  describe('CheckboxHandler', () => {
    const handler = getHandler('checkbox');

    it('validates boolean values', () => {
      expect(handler.validate(true).valid).toBe(true);
      expect(handler.validate(false).valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-boolean values', () => {
      expect(handler.validate('true').valid).toBe(false);
      expect(handler.validate(1).valid).toBe(false);
      expect(handler.validate(0).valid).toBe(false);
    });

    it('serializes to boolean', () => {
      expect(handler.serialize(true)).toBe(true);
      expect(handler.serialize(false)).toBe(false);
      expect(handler.serialize(null)).toBe(false);
    });

    it('deserializes to boolean', () => {
      expect(handler.deserialize(true)).toBe(true);
      expect(handler.deserialize(false)).toBe(false);
      expect(handler.deserialize(null)).toBe(false);
    });

    it('formats display as checkmark or cross', () => {
      expect(handler.formatDisplay(true)).toBe('\u2713');
      expect(handler.formatDisplay(false)).toBe('\u2717');
      expect(handler.formatDisplay(null)).toBe('\u2717');
    });

    it('returns checked/unchecked count aggregates', () => {
      const aggs = handler.getAggregates([true, true, false, null]);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 4 },
          { type: 'checked', value: 2 },
          { type: 'unchecked', value: 2 },
        ])
      );
      const pct = aggs.find(a => a.type === 'percentage');
      expect(pct!.value).toBe(50);
    });
  });

  // ─── UrlHandler ───────────────────────────────────────────────────────────────

  describe('UrlHandler', () => {
    const handler = getHandler('url');

    it('validates URL strings', () => {
      expect(handler.validate('https://example.com').valid).toBe(true);
      expect(handler.validate('http://localhost:3000/path').valid).toBe(true);
    });

    it('validates URL objects', () => {
      expect(handler.validate({ url: 'https://example.com' }).valid).toBe(true);
    });

    it('accepts null/undefined/empty as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('rejects invalid URL formats', () => {
      expect(handler.validate('not-a-url').valid).toBe(false);
      expect(handler.validate('ftp://file.com').valid).toBe(false);
    });

    it('rejects non-string/non-object values', () => {
      expect(handler.validate(123).valid).toBe(false);
      expect(handler.validate(true).valid).toBe(false);
    });

    it('serializes URL string to object', () => {
      expect(handler.serialize('https://example.com')).toEqual({ url: 'https://example.com' });
    });

    it('serializes URL object with displayText', () => {
      const result = handler.serialize({ url: 'https://example.com', displayText: 'Example' });
      expect(result).toEqual({ url: 'https://example.com', displayText: 'Example' });
    });

    it('serializes null/empty to null', () => {
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize('')).toBeNull();
    });

    it('deserializes URL object', () => {
      expect(handler.deserialize({ url: 'https://example.com' })).toEqual({
        url: 'https://example.com',
      });
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display showing displayText when available', () => {
      expect(handler.formatDisplay({ url: 'https://example.com', displayText: 'Example' })).toBe('Example');
      expect(handler.formatDisplay({ url: 'https://example.com' })).toBe('https://example.com');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns count aggregate', () => {
      const aggs = handler.getAggregates([{ url: 'https://a.com' }, null, { url: 'https://b.com' }]);
      expect(aggs).toEqual([{ type: 'count', value: 2 }]);
    });
  });

  // ─── RatingHandler ────────────────────────────────────────────────────────────

  describe('RatingHandler', () => {
    const handler = getHandler('rating');

    it('validates integers within default range (1-5)', () => {
      expect(handler.validate(1).valid).toBe(true);
      expect(handler.validate(5).valid).toBe(true);
      expect(handler.validate(3).valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects out-of-range ratings', () => {
      expect(handler.validate(0).valid).toBe(false);
      expect(handler.validate(6).valid).toBe(false);
      expect(handler.validate(-1).valid).toBe(false);
    });

    it('rejects non-integer numbers', () => {
      expect(handler.validate(3.5).valid).toBe(false);
    });

    it('rejects non-number values', () => {
      expect(handler.validate('3').valid).toBe(false);
      expect(handler.validate(true).valid).toBe(false);
    });

    it('validates against custom maxRating config', () => {
      const config = { maxRating: 10 };
      expect(handler.validate(10, config).valid).toBe(true);
      expect(handler.validate(11, config).valid).toBe(false);
    });

    it('serializes rating number', () => {
      expect(handler.serialize(4)).toBe(4);
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize(3.5)).toBeNull(); // not an integer
    });

    it('deserializes rating from JSON', () => {
      expect(handler.deserialize(4)).toBe(4);
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display as filled/empty stars', () => {
      const display = handler.formatDisplay(3);
      expect(display).toBe('\u2605\u2605\u2605\u2606\u2606');
    });

    it('formats display with custom maxRating', () => {
      const display = handler.formatDisplay(2, { maxRating: 3 });
      expect(display).toBe('\u2605\u2605\u2606');
    });

    it('returns average aggregate and distribution', () => {
      const aggs = handler.getAggregates([3, 4, 5, 3]);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 4 },
          { type: 'avg', value: 3.75 },
        ])
      );
      // Should also have distribution entries
      const rating3 = aggs.find(a => a.type === 'rating:3');
      expect(rating3!.value).toBe(2);
    });

    it('returns null average for empty values', () => {
      const aggs = handler.getAggregates([]);
      expect(aggs).toEqual([
        { type: 'count', value: 0 },
        { type: 'avg', value: null },
      ]);
    });
  });

  // ─── DropdownHandler ──────────────────────────────────────────────────────────

  describe('DropdownHandler', () => {
    const handler = getHandler('dropdown');
    const config = { options: ['Low', 'Medium', 'High'] };

    it('validates string against allowed options in config', () => {
      expect(handler.validate('Low', config).valid).toBe(true);
      expect(handler.validate('High', config).valid).toBe(true);
    });

    it('accepts null/undefined/empty as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('rejects values not in config options', () => {
      const result = handler.validate('Critical', config);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Invalid option/);
    });

    it('validates multi-select arrays when multiple is true', () => {
      const multiConfig = { options: ['A', 'B', 'C'], multiple: true };
      expect(handler.validate(['A', 'B'], multiConfig).valid).toBe(true);
    });

    it('rejects non-array for multi-select', () => {
      const multiConfig = { options: ['A', 'B'], multiple: true };
      expect(handler.validate('A', multiConfig).valid).toBe(false);
    });

    it('rejects invalid options in multi-select array', () => {
      const multiConfig = { options: ['A', 'B'], multiple: true };
      const result = handler.validate(['A', 'Z'], multiConfig);
      expect(result.valid).toBe(false);
    });

    it('accepts any string when no options configured', () => {
      expect(handler.validate('anything').valid).toBe(true);
    });

    it('serializes selection', () => {
      expect(handler.serialize('Low')).toBe('Low');
      expect(handler.serialize(['A', 'B'])).toEqual(['A', 'B']);
      expect(handler.serialize(null)).toBeNull();
      expect(handler.serialize('')).toBeNull();
    });

    it('deserializes selection', () => {
      expect(handler.deserialize('Low')).toBe('Low');
      expect(handler.deserialize(['A', 'B'])).toEqual(['A', 'B']);
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display for single and multi-select', () => {
      expect(handler.formatDisplay('Low')).toBe('Low');
      expect(handler.formatDisplay(['A', 'B'])).toBe('A, B');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns option distribution aggregates', () => {
      const aggs = handler.getAggregates(['Low', 'Low', 'High', null, '']);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 3 },
          { type: 'option:Low', value: 2 },
          { type: 'option:High', value: 1 },
        ])
      );
    });
  });

  // ─── PersonHandler ────────────────────────────────────────────────────────────

  describe('PersonHandler', () => {
    const handler = getHandler('person');

    it('validates array of person objects with id and name', () => {
      const result = handler.validate([{ id: 1, name: 'Alice' }]);
      expect(result.valid).toBe(true);
    });

    it('validates empty array as valid', () => {
      expect(handler.validate([]).valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-array values', () => {
      expect(handler.validate({ id: 1, name: 'Alice' }).valid).toBe(false);
      expect(handler.validate('Alice').valid).toBe(false);
    });

    it('rejects person objects with non-numeric id', () => {
      const result = handler.validate([{ id: 'abc', name: 'Alice' }]);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/numeric id/);
    });

    it('rejects person objects with empty name', () => {
      const result = handler.validate([{ id: 1, name: '' }]);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/non-empty name/);
    });

    it('serializes person array', () => {
      const result = handler.serialize([{ id: 1, name: 'Alice' }]);
      expect(result).toEqual([{ id: 1, name: 'Alice' }]);
      expect(handler.serialize(null)).toBeNull();
    });

    it('deserializes person array', () => {
      const result = handler.deserialize([{ id: 1, name: 'Alice' }]);
      expect(result).toEqual([{ id: 1, name: 'Alice' }]);
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display as comma-separated names', () => {
      expect(handler.formatDisplay([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]))
        .toBe('Alice, Bob');
      expect(handler.formatDisplay(null)).toBe('');
      expect(handler.formatDisplay([])).toBe('');
    });

    it('returns count and unique_persons aggregates', () => {
      const values = [
        [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
        [{ id: 1, name: 'Alice' }],
        null,
      ];
      const aggs = handler.getAggregates(values);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 2 },
          { type: 'unique_persons', value: 2 },
        ])
      );
    });
  });

  // ─── FilesHandler ─────────────────────────────────────────────────────────────

  describe('FilesHandler', () => {
    const handler = getHandler('files');
    const validFile = {
      id: 1,
      name: 'report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      url: '/uploads/report.pdf',
    };

    it('validates array of file objects', () => {
      expect(handler.validate([validFile]).valid).toBe(true);
      expect(handler.validate([]).valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-array values', () => {
      expect(handler.validate(validFile).valid).toBe(false);
      expect(handler.validate('file.pdf').valid).toBe(false);
    });

    it('rejects file objects missing required fields', () => {
      expect(handler.validate([{ id: 1 }]).valid).toBe(false);
      expect(handler.validate([{ ...validFile, id: 'abc' }]).valid).toBe(false);
      expect(handler.validate([{ ...validFile, name: '' }]).valid).toBe(false);
      expect(handler.validate([{ ...validFile, size: -1 }]).valid).toBe(false);
    });

    it('serializes file array', () => {
      const result = handler.serialize([validFile]);
      expect(result).toEqual([validFile]);
      expect(handler.serialize(null)).toBeNull();
    });

    it('deserializes file array', () => {
      const result = handler.deserialize([validFile]);
      expect(result).toEqual([validFile]);
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display showing file count', () => {
      expect(handler.formatDisplay([validFile])).toBe('report.pdf');
      expect(handler.formatDisplay([validFile, { ...validFile, id: 2, name: 'other.txt' }]))
        .toBe('2 files');
      expect(handler.formatDisplay(null)).toBe('');
      expect(handler.formatDisplay([])).toBe('');
    });

    it('returns count and total_size aggregates', () => {
      const values = [
        [{ ...validFile, size: 1000 }, { ...validFile, id: 2, size: 2000 }],
        [{ ...validFile, id: 3, size: 500 }],
      ];
      const aggs = handler.getAggregates(values);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 3 },
          { type: 'total_size', value: 3500 },
        ])
      );
    });
  });

  // ─── TimelineHandler ──────────────────────────────────────────────────────────

  describe('TimelineHandler', () => {
    const handler = getHandler('timeline');

    it('validates timeline with start and end dates', () => {
      const result = handler.validate({
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T00:00:00.000Z',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects missing start or end date', () => {
      expect(handler.validate({ start: '2024-01-01' }).valid).toBe(false);
      expect(handler.validate({ end: '2024-01-31' }).valid).toBe(false);
    });

    it('rejects non-object values', () => {
      expect(handler.validate('2024-01-01').valid).toBe(false);
      expect(handler.validate(123).valid).toBe(false);
    });

    it('rejects invalid date formats in timeline', () => {
      expect(handler.validate({ start: 'bad', end: '2024-01-31' }).valid).toBe(false);
      expect(handler.validate({ start: '2024-01-01', end: 'bad' }).valid).toBe(false);
    });

    it('rejects start date after end date', () => {
      const result = handler.validate({
        start: '2024-02-01T00:00:00.000Z',
        end: '2024-01-01T00:00:00.000Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/before or equal/);
    });

    it('serializes timeline object to ISO strings', () => {
      const result = handler.serialize({
        start: '2024-01-01',
        end: '2024-01-31',
      });
      expect(result.start).toMatch(/2024-01-01/);
      expect(result.end).toMatch(/2024-01-31/);
      expect(handler.serialize(null)).toBeNull();
    });

    it('deserializes timeline object', () => {
      const result = handler.deserialize({
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T00:00:00.000Z',
      });
      expect(result).toEqual({
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T00:00:00.000Z',
      });
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display as date range', () => {
      const display = handler.formatDisplay({
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T00:00:00.000Z',
      });
      expect(display).toBe('Jan 01 - Jan 31, 2024');
    });

    it('formats display with different years', () => {
      const display = handler.formatDisplay({
        start: '2023-12-15T00:00:00.000Z',
        end: '2024-01-15T00:00:00.000Z',
      });
      expect(display).toBe('Dec 15, 2023 - Jan 15, 2024');
    });

    it('returns duration aggregates', () => {
      const values = [
        { start: '2024-01-01T00:00:00.000Z', end: '2024-01-11T00:00:00.000Z' }, // 10 days
        { start: '2024-02-01T00:00:00.000Z', end: '2024-02-21T00:00:00.000Z' }, // 20 days
      ];
      const aggs = handler.getAggregates(values);
      expect(aggs).toEqual(
        expect.arrayContaining([
          { type: 'count', value: 2 },
          { type: 'total_duration_days', value: 30 },
          { type: 'avg_duration_days', value: 15 },
        ])
      );
    });

    it('returns null duration for empty values', () => {
      const aggs = handler.getAggregates([]);
      expect(aggs).toEqual([
        { type: 'count', value: 0 },
        { type: 'total_duration_days', value: null },
        { type: 'avg_duration_days', value: null },
      ]);
    });
  });

  // ─── FormulaHandler ───────────────────────────────────────────────────────────

  describe('FormulaHandler', () => {
    const handler = getHandler('formula');

    it('validates any value as valid (formulas are always computed)', () => {
      expect(handler.validate('anything').valid).toBe(true);
      expect(handler.validate(42).valid).toBe(true);
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('serializes formula result as-is', () => {
      expect(handler.serialize(42)).toBe(42);
      expect(handler.serialize('result')).toBe('result');
      expect(handler.serialize(null)).toBeNull();
    });

    it('deserializes formula result', () => {
      expect(handler.deserialize(42)).toBe(42);
      expect(handler.deserialize('result')).toBe('result');
      expect(handler.deserialize(null)).toBeNull();
    });

    it('formats display based on resultType config', () => {
      expect(handler.formatDisplay(42, { expression: '', resultType: 'number' })).toBe('42');
      expect(handler.formatDisplay('hello', { expression: '', resultType: 'text' })).toBe('hello');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('formats display for date resultType', () => {
      const display = handler.formatDisplay('2024-01-15T00:00:00.000Z', {
        expression: '',
        resultType: 'date',
      });
      expect(display).toBe('Jan 15, 2024');
    });

    it('returns count aggregate', () => {
      const aggs = handler.getAggregates([42, 'hello', null]);
      expect(aggs).toEqual([{ type: 'count', value: 2 }]);
    });
  });

  // ─── LongTextHandler ──────────────────────────────────────────────────────────

  describe('LongTextHandler', () => {
    const handler = getHandler('long_text');

    it('validates long text strings', () => {
      expect(handler.validate('A long paragraph of text.').valid).toBe(true);
      expect(handler.validate('').valid).toBe(true);
    });

    it('accepts null/undefined as valid', () => {
      expect(handler.validate(null).valid).toBe(true);
      expect(handler.validate(undefined).valid).toBe(true);
    });

    it('rejects non-string values', () => {
      expect(handler.validate(123).valid).toBe(false);
      expect(handler.validate({}).valid).toBe(false);
    });

    it('uses default maxLength of 50000', () => {
      const long = 'x'.repeat(50001);
      expect(handler.validate(long).valid).toBe(false);
      expect(handler.validate('x'.repeat(50000)).valid).toBe(true);
    });

    it('validates against custom maxLength config', () => {
      const config = { maxLength: 100 };
      expect(handler.validate('x'.repeat(101), config).valid).toBe(false);
      expect(handler.validate('x'.repeat(100), config).valid).toBe(true);
    });

    it('serializes long text', () => {
      expect(handler.serialize('hello world')).toBe('hello world');
      expect(handler.serialize(null)).toBeNull();
    });

    it('deserializes long text', () => {
      expect(handler.deserialize('hello world')).toBe('hello world');
      expect(handler.deserialize(null)).toBeNull();
    });

    it('truncates display for text longer than 100 characters', () => {
      const long = 'a'.repeat(150);
      const display = handler.formatDisplay(long);
      expect(display).toBe('a'.repeat(100) + '...');
    });

    it('does not truncate display for short text', () => {
      expect(handler.formatDisplay('short')).toBe('short');
      expect(handler.formatDisplay(null)).toBe('');
    });

    it('returns count aggregate for non-empty values', () => {
      const aggs = handler.getAggregates(['text', 'more text', '', null, undefined]);
      expect(aggs).toEqual([{ type: 'count', value: 2 }]);
    });
  });

  // ─── Cross-handler: getDefaultValue ────────────────────────────────────────────

  describe('Default Values', () => {
    it('each handler returns a sensible default', () => {
      expect(getHandler('status').getDefaultValue()).toBeNull();
      expect(getHandler('text').getDefaultValue()).toBe('');
      expect(getHandler('long_text').getDefaultValue()).toBe('');
      expect(getHandler('number').getDefaultValue()).toBeNull();
      expect(getHandler('date').getDefaultValue()).toBeNull();
      expect(getHandler('person').getDefaultValue()).toEqual([]);
      expect(getHandler('email').getDefaultValue()).toBe('');
      expect(getHandler('phone').getDefaultValue()).toBe('');
      expect(getHandler('dropdown').getDefaultValue()).toBeNull();
      expect(getHandler('checkbox').getDefaultValue()).toBe(false);
      expect(getHandler('url').getDefaultValue()).toBeNull();
      expect(getHandler('files').getDefaultValue()).toEqual([]);
      expect(getHandler('formula').getDefaultValue()).toBeNull();
      expect(getHandler('timeline').getDefaultValue()).toBeNull();
      expect(getHandler('rating').getDefaultValue()).toBeNull();
    });
  });

  // ─── Cross-handler: search ─────────────────────────────────────────────────────

  describe('Search (base class)', () => {
    it('searches by formatted display text (case-insensitive)', () => {
      const textHandler = getHandler('text');
      expect(textHandler.search('Hello World', 'hello')).toBe(true);
      expect(textHandler.search('Hello World', 'xyz')).toBe(false);
    });
  });
});
