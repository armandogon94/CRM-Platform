import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export class EmailHandler extends ColumnTypeHandler {
  readonly type = 'email';
  readonly label = 'Email';
  readonly icon = 'mail';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    if (typeof value !== 'string') {
      return { valid: false, error: 'Email must be a string' };
    }

    if (!EMAIL_REGEX.test(value)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim().toLowerCase();
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
