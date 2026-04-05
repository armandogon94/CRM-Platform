import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface FileValue {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export class FilesHandler extends ColumnTypeHandler {
  readonly type = 'files';
  readonly label = 'Files';
  readonly icon = 'paperclip';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (!Array.isArray(value)) {
      return { valid: false, error: 'Files value must be an array of file objects' };
    }

    for (let i = 0; i < value.length; i++) {
      const file = value[i];
      if (typeof file !== 'object' || file === null) {
        return { valid: false, error: `Item at index ${i} must be a file object` };
      }
      if (typeof file.id !== 'number') {
        return { valid: false, error: `File at index ${i} must have a numeric id` };
      }
      if (typeof file.name !== 'string' || file.name.trim() === '') {
        return { valid: false, error: `File at index ${i} must have a non-empty name` };
      }
      if (typeof file.size !== 'number' || file.size < 0) {
        return { valid: false, error: `File at index ${i} must have a valid size` };
      }
      if (typeof file.mimeType !== 'string') {
        return { valid: false, error: `File at index ${i} must have a mimeType string` };
      }
      if (typeof file.url !== 'string') {
        return { valid: false, error: `File at index ${i} must have a url string` };
      }
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;
    if (!Array.isArray(value)) return null;
    return value.map((f: FileValue) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      url: f.url,
    }));
  }

  deserialize(json: any): FileValue[] | null {
    if (json === null || json === undefined) return null;
    if (!Array.isArray(json)) return null;
    return json.map((f: any) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      url: f.url,
    }));
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    if (!Array.isArray(value) || value.length === 0) return '';

    if (value.length === 1) {
      return value[0].name || '1 file';
    }

    return `${value.length} files`;
  }

  getDefaultValue(_config?: ColumnConfig): FileValue[] {
    return [];
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonNull = values.filter(v => v !== null && v !== undefined && Array.isArray(v));
    const allFiles = nonNull.flat();
    const totalSize = allFiles.reduce((sum: number, f: FileValue) => sum + (f.size || 0), 0);

    return [
      { type: 'count', value: allFiles.length },
      { type: 'total_size', value: totalSize },
    ];
  }
}
