/**
 * Unit tests for LocationHandler — EAV handler for location column type.
 */

import { LocationHandler } from '../../services/LocationHandler';

describe('LocationHandler', () => {
  const handler = new LocationHandler();

  describe('validate', () => {
    it('accepts valid location with address, lat, lng', () => {
      const result = handler.validate({
        address: '123 Main St, New York, NY',
        lat: 40.7128,
        lng: -74.006,
      });
      expect(result.valid).toBe(true);
    });

    it('rejects missing address', () => {
      const result = handler.validate({ lat: 40.7128, lng: -74.006 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('address');
    });

    it('rejects missing lat', () => {
      const result = handler.validate({ address: '123 Main St', lng: -74.006 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lat');
    });

    it('rejects missing lng', () => {
      const result = handler.validate({ address: '123 Main St', lat: 40.7128 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lng');
    });

    it('rejects lat out of range', () => {
      const result = handler.validate({ address: 'Test', lat: 91, lng: 0 });
      expect(result.valid).toBe(false);
    });

    it('rejects lng out of range', () => {
      const result = handler.validate({ address: 'Test', lat: 0, lng: 181 });
      expect(result.valid).toBe(false);
    });

    it('accepts null value (empty location)', () => {
      const result = handler.validate(null);
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('returns JSON-compatible object', () => {
      const input = { address: '123 Main St', lat: 40.7128, lng: -74.006 };
      const output = handler.serialize(input);
      expect(output).toEqual(input);
    });

    it('returns null for null input', () => {
      expect(handler.serialize(null)).toBeNull();
    });
  });

  describe('format', () => {
    it('returns address string for display', () => {
      const value = { address: '123 Main St, NY', lat: 40.7128, lng: -74.006 };
      expect(handler.format(value)).toBe('123 Main St, NY');
    });

    it('returns empty string for null', () => {
      expect(handler.format(null)).toBe('');
    });
  });
});
