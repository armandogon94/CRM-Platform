import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface RatingConfig extends ColumnConfig {
  maxRating?: number;
}

export class RatingHandler extends ColumnTypeHandler {
  readonly type = 'rating';
  readonly label = 'Rating';
  readonly icon = 'star';

  validate(value: any, config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return { valid: false, error: 'Rating must be an integer' };
    }

    const ratingConfig = config as RatingConfig | undefined;
    const maxRating = ratingConfig?.maxRating ?? 5;

    if (value < 1 || value > maxRating) {
      return { valid: false, error: `Rating must be between 1 and ${maxRating}` };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) return null;
    return num;
  }

  deserialize(json: any): number | null {
    if (json === null || json === undefined) return null;
    const num = Number(json);
    return isNaN(num) ? null : Math.round(num);
  }

  formatDisplay(value: any, config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';

    const num = Number(value);
    if (isNaN(num)) return '';

    const ratingConfig = config as RatingConfig | undefined;
    const maxRating = ratingConfig?.maxRating ?? 5;

    const filled = Math.min(Math.max(Math.round(num), 0), maxRating);
    const empty = maxRating - filled;

    return '\u2605'.repeat(filled) + '\u2606'.repeat(empty);
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const ratings = values
      .filter(v => v !== null && v !== undefined)
      .map(v => Number(v))
      .filter(n => !isNaN(n) && Number.isInteger(n));

    if (ratings.length === 0) {
      return [
        { type: 'count', value: 0 },
        { type: 'avg', value: null },
      ];
    }

    const sum = ratings.reduce((acc, n) => acc + n, 0);
    const avg = sum / ratings.length;

    // Distribution: count per rating value
    const distribution = new Map<number, number>();
    for (const r of ratings) {
      distribution.set(r, (distribution.get(r) || 0) + 1);
    }

    const results: AggregateResult[] = [
      { type: 'count', value: ratings.length },
      { type: 'avg', value: Math.round(avg * 100) / 100 },
    ];

    for (const [rating, count] of distribution) {
      results.push({ type: `rating:${rating}`, value: count });
    }

    return results;
  }

  compare(a: any, b: any): number {
    const aNum = a !== null && a !== undefined ? Number(a) : -Infinity;
    const bNum = b !== null && b !== undefined ? Number(b) : -Infinity;
    if (isNaN(aNum) && isNaN(bNum)) return 0;
    if (isNaN(aNum)) return -1;
    if (isNaN(bNum)) return 1;
    return aNum - bNum;
  }
}
