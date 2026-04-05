import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface TextConfig extends ColumnConfig {
  maxLength?: number;
}

export class TextHandler extends ColumnTypeHandler {
  readonly type = 'text';
  readonly label = 'Text';
  readonly icon = 'type';

  validate(value: any, config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    if (typeof value !== 'string') {
      return { valid: false, error: 'Value must be a string' };
    }

    const textConfig = config as TextConfig | undefined;
    const maxLength = textConfig?.maxLength ?? 1000;
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
