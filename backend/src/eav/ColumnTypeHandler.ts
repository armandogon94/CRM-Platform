export interface ColumnConfig {
  [key: string]: any;
}

export interface AggregateResult {
  type: string;
  value: number | string | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export abstract class ColumnTypeHandler {
  abstract readonly type: string;
  abstract readonly label: string;
  abstract readonly icon: string;

  abstract validate(value: any, config?: ColumnConfig): ValidationResult;
  abstract serialize(value: any): any;
  abstract deserialize(json: any): any;
  abstract formatDisplay(value: any, config?: ColumnConfig): string;
  abstract getDefaultValue(config?: ColumnConfig): any;

  getAggregates(values: any[]): AggregateResult[] {
    return [
      { type: 'count', value: values.filter(v => v !== null && v !== undefined).length },
    ];
  }

  search(value: any, query: string): boolean {
    const display = this.formatDisplay(value);
    return display.toLowerCase().includes(query.toLowerCase());
  }

  compare(a: any, b: any): number {
    const aStr = this.formatDisplay(a);
    const bStr = this.formatDisplay(b);
    return aStr.localeCompare(bStr);
  }
}
