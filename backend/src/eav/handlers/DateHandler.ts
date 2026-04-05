import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface DateConfig extends ColumnConfig {
  includeTime?: boolean;
  format?: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export class DateHandler extends ColumnTypeHandler {
  readonly type = 'date';
  readonly label = 'Date';
  readonly icon = 'calendar';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    if (typeof value !== 'string') {
      return { valid: false, error: 'Date must be an ISO date string' };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format. Must be a valid ISO date string' };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return null;
  }

  deserialize(json: any): string | null {
    if (json === null || json === undefined) return null;
    return String(json);
  }

  formatDisplay(value: any, config?: ColumnConfig): string {
    if (value === null || value === undefined || value === '') return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const dateConfig = config as DateConfig | undefined;
    const month = MONTH_NAMES[date.getUTCMonth()];
    const day = date.getUTCDate().toString().padStart(2, '0');
    const year = date.getUTCFullYear();

    let result = `${month} ${day}, ${year}`;

    if (dateConfig?.includeTime) {
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      result += ` ${hours}:${minutes}`;
    }

    return result;
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const dates = values
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => new Date(v))
      .filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) {
      return [
        { type: 'count', value: 0 },
        { type: 'earliest', value: null },
        { type: 'latest', value: null },
      ];
    }

    const timestamps = dates.map(d => d.getTime());
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));

    return [
      { type: 'count', value: dates.length },
      { type: 'earliest', value: earliest.toISOString() },
      { type: 'latest', value: latest.toISOString() },
    ];
  }

  compare(a: any, b: any): number {
    const aTime = a ? new Date(a).getTime() : -Infinity;
    const bTime = b ? new Date(b).getTime() : -Infinity;
    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return -1;
    if (isNaN(bTime)) return 1;
    return aTime - bTime;
  }
}
