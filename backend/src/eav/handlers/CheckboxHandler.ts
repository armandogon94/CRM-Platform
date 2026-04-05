import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export class CheckboxHandler extends ColumnTypeHandler {
  readonly type = 'checkbox';
  readonly label = 'Checkbox';
  readonly icon = 'check-square';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (typeof value !== 'boolean') {
      return { valid: false, error: 'Checkbox value must be a boolean' };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return false;
    return Boolean(value);
  }

  deserialize(json: any): boolean {
    if (json === null || json === undefined) return false;
    return Boolean(json);
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '\u2717';
    return value ? '\u2713' : '\u2717';
  }

  getDefaultValue(_config?: ColumnConfig): boolean {
    return false;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const booleans = values.map(v => Boolean(v));
    const checked = booleans.filter(v => v === true).length;
    const unchecked = booleans.filter(v => v === false).length;
    const total = booleans.length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return [
      { type: 'count', value: total },
      { type: 'checked', value: checked },
      { type: 'unchecked', value: unchecked },
      { type: 'percentage', value: percentage },
    ];
  }

  compare(a: any, b: any): number {
    const aBool = Boolean(a);
    const bBool = Boolean(b);
    if (aBool === bBool) return 0;
    return aBool ? 1 : -1;
  }
}
