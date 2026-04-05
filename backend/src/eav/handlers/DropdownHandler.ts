import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface DropdownConfig extends ColumnConfig {
  options: string[];
  multiple?: boolean;
}

export class DropdownHandler extends ColumnTypeHandler {
  readonly type = 'dropdown';
  readonly label = 'Dropdown';
  readonly icon = 'chevron-down';

  validate(value: any, config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    const dropdownConfig = config as DropdownConfig | undefined;
    const options = dropdownConfig?.options ?? [];
    const isMultiple = dropdownConfig?.multiple ?? false;

    if (isMultiple) {
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Multi-select dropdown value must be an array' };
      }
      for (const item of value) {
        if (typeof item !== 'string') {
          return { valid: false, error: 'Each dropdown option must be a string' };
        }
        if (options.length > 0 && !options.includes(item)) {
          return { valid: false, error: `Invalid option: "${item}". Must be one of: ${options.join(', ')}` };
        }
      }
    } else {
      if (typeof value !== 'string') {
        return { valid: false, error: 'Dropdown value must be a string' };
      }
      if (options.length > 0 && !options.includes(value)) {
        return { valid: false, error: `Invalid option: "${value}". Must be one of: ${options.join(', ')}` };
      }
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined || value === '') return null;
    if (Array.isArray(value)) return value;
    return value;
  }

  deserialize(json: any): string | string[] | null {
    if (json === null || json === undefined) return null;
    return json;
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  getDefaultValue(config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const results: AggregateResult[] = [
      { type: 'count', value: nonNull.length },
    ];

    const counts = new Map<string, number>();
    for (const v of nonNull) {
      const items = Array.isArray(v) ? v : [v];
      for (const item of items) {
        const key = String(item);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    for (const [option, count] of counts) {
      results.push({ type: `option:${option}`, value: count });
    }

    return results;
  }
}
