import { TriggerType } from '../models/Automation';

export interface TriggerSpec {
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
}

export interface EventContext {
  triggerType: string;
  boardId: number;
  item?: any;
  itemId?: number;
  changes?: Record<string, unknown>;
  columnId?: number;
  oldValue?: unknown;
  newValue?: unknown;
  dateValue?: string;
}

/**
 * Pure function: does the given automation trigger match the event context?
 */
export function matches(trigger: TriggerSpec, context: EventContext): boolean {
  if (trigger.triggerType !== context.triggerType) {
    return false;
  }

  switch (trigger.triggerType) {
    case 'on_item_created':
      return true;

    case 'on_item_updated':
      return matchItemUpdated(trigger.triggerConfig, context);

    case 'on_status_changed':
      return matchStatusChanged(trigger.triggerConfig, context);

    case 'on_date_reached':
      return matchDateReached(context);

    case 'on_recurring':
      return true;

    default:
      return false;
  }
}

function matchItemUpdated(
  config: Record<string, unknown>,
  context: EventContext
): boolean {
  if (config.field && typeof config.field === 'string' && context.changes) {
    return config.field in context.changes;
  }
  return true;
}

function matchStatusChanged(
  config: Record<string, unknown>,
  context: EventContext
): boolean {
  if (config.columnId !== undefined && config.columnId !== context.columnId) {
    return false;
  }
  if (config.fromStatus !== undefined && config.fromStatus !== context.oldValue) {
    return false;
  }
  if (config.toStatus !== undefined && config.toStatus !== context.newValue) {
    return false;
  }
  return true;
}

function matchDateReached(context: EventContext): boolean {
  if (!context.dateValue) return false;
  const target = new Date(context.dateValue);
  return new Date() >= target;
}
