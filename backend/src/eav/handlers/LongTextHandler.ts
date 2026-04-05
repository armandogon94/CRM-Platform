import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface LongTextConfig extends ColumnConfig {
  maxLength?: number;
}

export class LongTextHandler extends ColumnTypeHandler {
  readonly type = 'long_text';
  readonly label = 'Long Text';
  readonly icon = 'align-left';

  validate(value: any, config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    if (typeof value !== 'string') {
      return { valid: false, error: 'Value must be a string' };
    }

    const textConfig = config as LongTextConfig | undefined;
    const maxLength = textConfig?.maxLength ?? 50000;
    if (value.length > maxLength) {
      return { valid: false, error: `Text exceeds maximum length of ${maxLength} characters` };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;
    return String(value);
  }

  deserialize(json: any): string | null {
    if (json === null || json === undefined) return null;
    return String(json);
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.length > 100) {
      return str.substring(0, 100) + '...';
    }
    return str;
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
