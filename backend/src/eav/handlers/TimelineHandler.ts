import { ColumnTypeHandler, ColumnConfig, ValidationResult, AggregateResult } from '../ColumnTypeHandler';

export interface TimelineValue {
  start: string;
  end: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class TimelineHandler extends ColumnTypeHandler {
  readonly type = 'timeline';
  readonly label = 'Timeline';
  readonly icon = 'calendar-range';

  validate(value: any, _config?: ColumnConfig): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    if (typeof value !== 'object') {
      return { valid: false, error: 'Timeline must be an object with start and end date strings' };
    }

    if (!value.start || !value.end) {
      return { valid: false, error: 'Timeline must have both start and end dates' };
    }

    const startDate = new Date(value.start);
    const endDate = new Date(value.end);

    if (isNaN(startDate.getTime())) {
      return { valid: false, error: 'Invalid start date format' };
    }

    if (isNaN(endDate.getTime())) {
      return { valid: false, error: 'Invalid end date format' };
    }

    if (startDate.getTime() > endDate.getTime()) {
      return { valid: false, error: 'Start date must be before or equal to end date' };
    }

    return { valid: true };
  }

  serialize(value: any): any {
    if (value === null || value === undefined) return null;

    const startDate = new Date(value.start);
    const endDate = new Date(value.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }

  deserialize(json: any): TimelineValue | null {
    if (json === null || json === undefined) return null;
    if (!json.start || !json.end) return null;
    return {
      start: json.start,
      end: json.end,
    };
  }

  formatDisplay(value: any, _config?: ColumnConfig): string {
    if (value === null || value === undefined) return '';

    const startDate = new Date(value.start);
    const endDate = new Date(value.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

    const startMonth = MONTH_NAMES[startDate.getUTCMonth()];
    const startDay = startDate.getUTCDate().toString().padStart(2, '0');
    const endMonth = MONTH_NAMES[endDate.getUTCMonth()];
    const endDay = endDate.getUTCDate().toString().padStart(2, '0');
    const endYear = endDate.getUTCFullYear();

    // If same year, omit year from start
    if (startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    }

    const startYear = startDate.getUTCFullYear();
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  }

  getDefaultValue(_config?: ColumnConfig): null {
    return null;
  }

  getAggregates(values: any[]): AggregateResult[] {
    const timelines = values.filter(v => {
      if (v === null || v === undefined) return false;
      const s = new Date(v.start);
      const e = new Date(v.end);
      return !isNaN(s.getTime()) && !isNaN(e.getTime());
    });

    if (timelines.length === 0) {
      return [
        { type: 'count', value: 0 },
        { type: 'total_duration_days', value: null },
        { type: 'avg_duration_days', value: null },
      ];
    }

    const durations = timelines.map(v => {
      const s = new Date(v.start).getTime();
      const e = new Date(v.end).getTime();
      return (e - s) / MS_PER_DAY;
    });

    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / durations.length;

    return [
      { type: 'count', value: timelines.length },
      { type: 'total_duration_days', value: Math.round(totalDuration * 100) / 100 },
      { type: 'avg_duration_days', value: Math.round(avgDuration * 100) / 100 },
    ];
  }

  compare(a: any, b: any): number {
    const aTime = a?.start ? new Date(a.start).getTime() : -Infinity;
    const bTime = b?.start ? new Date(b.start).getTime() : -Infinity;
    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return -1;
    if (isNaN(bTime)) return 1;
    return aTime - bTime;
  }
}
