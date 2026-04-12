export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class LocationHandler {
  validate(value: unknown): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (typeof value !== 'object') {
      return { valid: false, error: 'Location must be an object with address, lat, lng' };
    }

    const loc = value as Record<string, unknown>;

    if (typeof loc.address !== 'string' || !loc.address.trim()) {
      return { valid: false, error: 'address is required and must be a string' };
    }

    if (typeof loc.lat !== 'number') {
      return { valid: false, error: 'lat is required and must be a number' };
    }

    if (typeof loc.lng !== 'number') {
      return { valid: false, error: 'lng is required and must be a number' };
    }

    if (loc.lat < -90 || loc.lat > 90) {
      return { valid: false, error: 'lat must be between -90 and 90' };
    }

    if (loc.lng < -180 || loc.lng > 180) {
      return { valid: false, error: 'lng must be between -180 and 180' };
    }

    return { valid: true };
  }

  serialize(value: LocationValue | null): LocationValue | null {
    if (!value) return null;
    return {
      address: value.address,
      lat: value.lat,
      lng: value.lng,
    };
  }

  format(value: LocationValue | null): string {
    if (!value) return '';
    return value.address;
  }
}

export const locationHandler = new LocationHandler();
