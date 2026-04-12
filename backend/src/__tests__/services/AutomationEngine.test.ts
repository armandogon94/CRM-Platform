/**
 * Tests for AutomationEngine — orchestrates trigger evaluation and action execution.
 */

const mockMatches = jest.fn();
jest.mock('../../services/TriggerEvaluator', () => ({
  matches: (...a: any[]) => mockMatches(...a),
}));

const mockExecute = jest.fn();
jest.mock('../../services/ActionExecutor', () => ({
  execute: (...a: any[]) => mockExecute(...a),
}));

jest.mock('../../models', () => ({
  Automation: {
    findAll: jest.fn(),
  },
  AutomationLog: {
    create: jest.fn(),
  },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import { AutomationEngine } from '../../services/AutomationEngine';
import { Automation, AutomationLog } from '../../models';

describe('AutomationEngine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('queries active automations for the board and evaluates triggers', async () => {
    const automation = {
      id: 1, boardId: 10, triggerType: 'on_item_created',
      triggerConfig: {}, actionType: 'send_notification',
      actionConfig: { userId: 5, title: 'New item' }, isActive: true,
    };
    (Automation.findAll as jest.Mock).mockResolvedValue([automation]);
    mockMatches.mockReturnValue(true);
    mockExecute.mockResolvedValue({ success: true, data: {} });
    (AutomationLog.create as jest.Mock).mockResolvedValue({ id: 1 });

    await AutomationEngine.evaluate('on_item_created', { boardId: 10, item: { id: 1 } });

    expect(Automation.findAll).toHaveBeenCalledWith({
      where: { boardId: 10, isActive: true },
    });
    expect(mockMatches).toHaveBeenCalledWith(
      { triggerType: 'on_item_created', triggerConfig: {} },
      expect.objectContaining({ triggerType: 'on_item_created', boardId: 10 })
    );
    expect(mockExecute).toHaveBeenCalledWith(
      'send_notification',
      { userId: 5, title: 'New item' },
      expect.objectContaining({ boardId: 10 })
    );
  });

  it('creates success AutomationLog when action succeeds', async () => {
    const automation = {
      id: 1, boardId: 10, triggerType: 'on_item_created',
      triggerConfig: {}, actionType: 'set_column_value',
      actionConfig: { columnId: 3, value: 'Done' }, isActive: true,
    };
    (Automation.findAll as jest.Mock).mockResolvedValue([automation]);
    mockMatches.mockReturnValue(true);
    mockExecute.mockResolvedValue({ success: true, data: { columnValueId: 5 } });
    (AutomationLog.create as jest.Mock).mockResolvedValue({ id: 1 });

    await AutomationEngine.evaluate('on_item_created', { boardId: 10, item: { id: 1 } });

    expect(AutomationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: 1,
        status: 'success',
        actionResult: { columnValueId: 5 },
      })
    );
  });

  it('creates skipped AutomationLog when trigger does not match', async () => {
    const automation = {
      id: 2, boardId: 10, triggerType: 'on_status_changed',
      triggerConfig: { toStatus: 'Done' }, actionType: 'send_notification',
      actionConfig: {}, isActive: true,
    };
    (Automation.findAll as jest.Mock).mockResolvedValue([automation]);
    mockMatches.mockReturnValue(false);
    (AutomationLog.create as jest.Mock).mockResolvedValue({ id: 2 });

    await AutomationEngine.evaluate('on_status_changed', {
      boardId: 10, itemId: 1, columnId: 5, oldValue: 'Working', newValue: 'Stuck',
    });

    expect(mockExecute).not.toHaveBeenCalled();
    expect(AutomationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: 2,
        status: 'skipped',
      })
    );
  });

  it('creates failure AutomationLog when action fails', async () => {
    const automation = {
      id: 3, boardId: 10, triggerType: 'on_item_created',
      triggerConfig: {}, actionType: 'send_email',
      actionConfig: { to: 'user@test.com' }, isActive: true,
    };
    (Automation.findAll as jest.Mock).mockResolvedValue([automation]);
    mockMatches.mockReturnValue(true);
    mockExecute.mockResolvedValue({ success: false, error: 'SMTP failure' });
    (AutomationLog.create as jest.Mock).mockResolvedValue({ id: 3 });

    await AutomationEngine.evaluate('on_item_created', { boardId: 10, item: { id: 1 } });

    expect(AutomationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: 3,
        status: 'failure',
        errorMessage: 'SMTP failure',
      })
    );
  });

  it('evaluates multiple automations for same board', async () => {
    const automations = [
      { id: 1, boardId: 10, triggerType: 'on_item_created', triggerConfig: {}, actionType: 'send_notification', actionConfig: {}, isActive: true },
      { id: 2, boardId: 10, triggerType: 'on_item_created', triggerConfig: {}, actionType: 'set_column_value', actionConfig: {}, isActive: true },
    ];
    (Automation.findAll as jest.Mock).mockResolvedValue(automations);
    mockMatches.mockReturnValue(true);
    mockExecute.mockResolvedValue({ success: true, data: {} });
    (AutomationLog.create as jest.Mock).mockResolvedValue({});

    await AutomationEngine.evaluate('on_item_created', { boardId: 10, item: { id: 1 } });

    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(AutomationLog.create).toHaveBeenCalledTimes(2);
  });

  it('does nothing when no automations exist for board', async () => {
    (Automation.findAll as jest.Mock).mockResolvedValue([]);

    await AutomationEngine.evaluate('on_item_created', { boardId: 10, item: { id: 1 } });

    expect(mockMatches).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
