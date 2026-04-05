import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface PersonValue {
  id: number;
  name: string;
}

export class PersonHandler extends ColumnTypeHandler {
  readonly type = 'person';
  readonly label = 'Person';
  readonly icon = 'user';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (!Array.isArray(value)) {
      return { valid: false, error: 'Person value must be an array of person objects' };
    }

    for (let i = 0; i < value.length; i++) {
      const person = value[i];
      if (typeof person !== 'object' || person === null) {
        return { valid: false, error: `Item at index ${i} must be an object` };
      }
      if (typeof person.id !== 'number') {
        return { valid: false, error: `Item at index ${i} must have a numeric id` };
      }
      if (typeof person.name !== 'string' || person.name.trim() === '') {
        return { valid: false, error: `Item at index ${i} must have a non-empty name string` };
      }
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;
    if (!Array.isArray(value)) return null;
    return value.map((p: PersonValue) => ({ id: p.id, name: p.name }));
  }

  deserialize(json: any): PersonValue[] | null {
    if (json === null || json === undefined) return null;
    if (!Array.isArray(json)) return null;
    return json.map((p: any) => ({ id: p.id, name: p.name }));
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    if (!Array.isArray(value) || value.length === 0) return '';
    return value.map((p: PersonValue) => p.name).join(', ');
  }

  getDefaultValue(_config?: ColumnConfig): PersonValue[] {
    return [];
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonNull = values.filter(v => v !== null && v !== undefined && Array.isArray(v));
    const allPersons = nonNull.flat();
    const uniqueIds = new Set(allPersons.map((p: PersonValue) => p.id));

    return [
      { type: 'count', value: nonNull.length },
      { type: 'unique_persons', value: uniqueIds.size },
    ];
  }
}
