import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface UrlValue {
  url: string;
  displayText?: string;
}

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export class UrlHandler extends ColumnTypeHandler {
  readonly type = 'url';
  readonly label = 'URL';
  readonly icon = 'link';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    let url: string;

    if (typeof value === 'string') {
      url = value;
    } else if (typeof value === 'object' && value.url) {
      url = value.url;
    } else {
      return { valid: false, error: 'URL must be a string or an object with a url property' };
    }

    if (!URL_REGEX.test(url)) {
      return { valid: false, error: 'Invalid URL format. Must start with http:// or https://' };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'string') {
      return { url: value };
    }

    if (typeof value === 'object' && value.url) {
      return {
        url: value.url,
        ...(value.displayText ? { displayText: value.displayText } : {}),
      };
    }

    return null;
  }

  deserialize(json: any): UrlValue | null {
    if (json === null || json === undefined) return null;

    if (typeof json === 'string') {
      return { url: json };
    }

    if (typeof json === 'object' && json.url) {
      return {
        url: json.url,
        ...(json.displayText ? { displayText: json.displayText } : {}),
      };
    }

    return null;
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') return value;

    if (typeof value === 'object') {
      return value.displayText || value.url || '';
    }

    return '';
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonNull = values.filter(v => v !== null && v !== undefined);
    return [
      { type: 'count', value: nonNull.length },
    ];
  }
}
