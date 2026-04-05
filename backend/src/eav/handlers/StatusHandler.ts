import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface StatusValue {
  label: string;
  color: string;
}

export interface StatusConfig extends ColumnConfig {
  labels: StatusValue[];
}

export class StatusHandler extends ColumnTypeHandler {
  readonly type = 'status';
  readonly label = 'Status';
  readonly icon = 'circle-dot';

  validate(value: any, config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (typeof value !== 'object' || !value.label || !value.color) {
      return { valid: false, error: 'Status must be an object with label and color properties' };
    }

    const statusConfig = config as StatusConfig | undefined;
    if (statusConfig?.labels) {
      const validLabel = statusConfig.labels.some(
        (s) => s.label === value.label
      );
      if (!validLabel) {
        return { valid: false, error: `Invalid status label: "${value.label}". Must be one of: ${statusConfig.labels.map(s => s.label).join(', ')}` };
      }
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;
    return { label: value.label, color: value.color };
  }

  deserialize(json: any): StatusValue | null {
    if (json === null || json === undefined) return null;
    return { label: json.label, color: json.color };
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';
    return value.label || '';
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const nonNull = values.filter(v => v !== null && v !== undefined);
    const results: AggregateResult[] = [
      { type: 'count', value: nonNull.length },
    ];

    const counts = new Map<string, number>();
    for (const v of nonNull) {
      const label = v.label || 'Unknown';
      counts.set(label, (counts.get(label) || 0) + 1);
    }

    for (const [label, count] of counts) {
      results.push({ type: `status:${label}`, value: count });
    }

    return results;
  }

  compare(a: any, b: any): number {
    const aLabel = a?.label || '';
    const bLabel = b?.label || '';
    return aLabel.localeCompare(bLabel);
  }
}
