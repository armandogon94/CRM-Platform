import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface NumberConfig extends ColumnConfig {
  min?: number;
  max?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  unit?: string;
}

export class NumberHandler extends ColumnTypeHandler {
  readonly type = 'number';
  readonly label = 'Number';
  readonly icon = 'hash';

  validate(value: any, config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (typeof num !== 'number' || isNaN(num)) {
      return { valid: false, error: 'Value must be a valid number' };
    }

    const numConfig = config as NumberConfig | undefined;

    if (numConfig?.min !== undefined && num < numConfig.min) {
      return { valid: false, error: `Value must be at least ${numConfig.min}` };
    }

    if (numConfig?.max !== undefined && num > numConfig.max) {
      return { valid: false, error: `Value must be at most ${numConfig.max}` };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return null;
    return num;
  }

  deserialize(json: any): number | null {
    if (json === null || json === undefined) return null;
    const num = Number(json);
    return isNaN(num) ? null : num;
  }

  formatDisplay(value: any, config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '';

    const numConfig = config as NumberConfig | undefined;
    const decimals = numConfig?.decimals ?? 0;
    const prefix = numConfig?.prefix ?? '';
    const suffix = numConfig?.suffix ?? '';
    const unit = numConfig?.unit ?? '';

    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    let result = `${prefix}${formatted}`;
    if (suffix) result += suffix;
    if (unit) result += ` ${unit}`;

    return result;
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const numbers = values
      .filter(v => v !== null && v !== undefined)
      .map(v => (typeof v === 'number' ? v : parseFloat(v)))
      .filter(n => !isNaN(n));

    if (numbers.length === 0) {
      return [
        { type: 'count', value: 0 },
        { type: 'sum', value: null },
        { type: 'avg', value: null },
        { type: 'min', value: null },
        { type: 'max', value: null },
      ];
    }

    const sum = numbers.reduce((acc, n) => acc + n, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);

    return [
      { type: 'count', value: numbers.length },
      { type: 'sum', value: Math.round(sum * 100) / 100 },
      { type: 'avg', value: Math.round(avg * 100) / 100 },
      { type: 'min', value: min },
      { type: 'max', value: max },
    ];
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
