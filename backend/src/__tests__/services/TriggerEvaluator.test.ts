/**
 * Unit tests for TriggerEvaluator — pure function pattern matching.
 * No mocks needed; TriggerEvaluator is a pure function module.
 */

import { matches } from '../../services/TriggerEvaluator';
import { TriggerType } from '../../models/Automation';

describe('TriggerEvaluator', () => {
  describe('on_item_created', () => {
    it('matches when trigger type is on_item_created and boardId matches', () => {
      const result = matches(
        { triggerType: 'on_item_created' as TriggerType, triggerConfig: {} },
        { triggerType: 'on_item_created', boardId: 10, item: { id: 1, name: 'Test' } }
      );
      expect(result).toBe(true);
    });

    it('does not match when trigger type differs', () => {
      const result = matches(
        { triggerType: 'on_item_updated' as TriggerType, triggerConfig: {} },
        { triggerType: 'on_item_created', boardId: 10, item: { id: 1 } }
      );
      expect(result).toBe(false);
    });
  });

  describe('on_item_updated', () => {
    it('matches any item update when no field filter in config', () => {
      const result = matches(
        { triggerType: 'on_item_updated' as TriggerType, triggerConfig: {} },
        { triggerType: 'on_item_updated', boardId: 10, item: { id: 1 }, changes: { name: 'New' } }
      );
      expect(result).toBe(true);
    });

    it('matches when specific field in config matches changed field', () => {
      const result = matches(
        { triggerType: 'on_item_updated' as TriggerType, triggerConfig: { field: 'name' } },
        { triggerType: 'on_item_updated', boardId: 10, item: { id: 1 }, changes: { name: 'New' } }
      );
      expect(result).toBe(true);
    });

    it('does not match when field filter does not match changes', () => {
      const result = matches(
        { triggerType: 'on_item_updated' as TriggerType, triggerConfig: { field: 'position' } },
        { triggerType: 'on_item_updated', boardId: 10, item: { id: 1 }, changes: { name: 'New' } }
      );
      expect(result).toBe(false);
    });
  });

  describe('on_status_changed', () => {
    it('matches any status change when no specific status in config', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: {} },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'Working', newValue: 'Done' }
      );
      expect(result).toBe(true);
    });

    it('matches when toStatus in config matches newValue', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: { toStatus: 'Done' } },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'Working', newValue: 'Done' }
      );
      expect(result).toBe(true);
    });

    it('does not match when toStatus does not match newValue', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: { toStatus: 'Stuck' } },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'Working', newValue: 'Done' }
      );
      expect(result).toBe(false);
    });

    it('matches when both fromStatus and toStatus match', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: { fromStatus: 'Working', toStatus: 'Done' } },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'Working', newValue: 'Done' }
      );
      expect(result).toBe(true);
    });

    it('does not match when fromStatus does not match oldValue', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: { fromStatus: 'Stuck', toStatus: 'Done' } },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'Working', newValue: 'Done' }
      );
      expect(result).toBe(false);
    });

    it('matches when columnId in config matches event columnId', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: { columnId: 5 } },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'A', newValue: 'B' }
      );
      expect(result).toBe(true);
    });

    it('does not match when columnId in config differs from event', () => {
      const result = matches(
        { triggerType: 'on_status_changed' as TriggerType, triggerConfig: { columnId: 99 } },
        { triggerType: 'on_status_changed', boardId: 10, itemId: 1, columnId: 5, oldValue: 'A', newValue: 'B' }
      );
      expect(result).toBe(false);
    });
  });

  describe('on_date_reached', () => {
    it('matches when current date is on or after the target date column value', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = matches(
        { triggerType: 'on_date_reached' as TriggerType, triggerConfig: { columnId: 3 } },
        { triggerType: 'on_date_reached', boardId: 10, itemId: 1, columnId: 3, dateValue: yesterday.toISOString() }
      );
      expect(result).toBe(true);
    });

    it('does not match when date is in the future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = matches(
        { triggerType: 'on_date_reached' as TriggerType, triggerConfig: { columnId: 3 } },
        { triggerType: 'on_date_reached', boardId: 10, itemId: 1, columnId: 3, dateValue: tomorrow.toISOString() }
      );
      expect(result).toBe(false);
    });
  });

  describe('on_recurring', () => {
    it('always matches when trigger type is on_recurring (scheduler handles timing)', () => {
      const result = matches(
        { triggerType: 'on_recurring' as TriggerType, triggerConfig: { cron: '0 9 * * 1' } },
        { triggerType: 'on_recurring', boardId: 10 }
      );
      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns false for unknown trigger type', () => {
      const result = matches(
        { triggerType: 'unknown_type' as TriggerType, triggerConfig: {} },
        { triggerType: 'unknown_type', boardId: 10 }
      );
      expect(result).toBe(false);
    });
  });
});
