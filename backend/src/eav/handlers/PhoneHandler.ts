import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

const PHONE_REGEX = /^[+\d][\d\s\-().]{6,20}$/;

export class PhoneHandler extends ColumnTypeHandler {
  readonly type = 'phone';
  readonly label = 'Phone';
  readonly icon = 'phone';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    if (typeof value !== 'string') {
      return { valid: false, error: 'Phone number must be a string' };
    }

    if (!PHONE_REGEX.test(value.trim())) {
      return { valid: false, error: 'Invalid phone number format. Use digits, +, -, (, ), and spaces' };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim();
  }

  deserialize(json: any): string | null {
    if (json === null || json === undefined) return null;
    return String(json);
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  getDefaultValue(_config?: ColumnConfig): string {
    return '';
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
    return [
      { type: 'count', value: nonEmpty.length },
    ];
  }
}
