import { Automation, AutomationLog } from '../models';
import { matches, EventContext } from './TriggerEvaluator';
import { execute } from './ActionExecutor';
import { logger } from '../utils/logger';

export class AutomationEngine {
  /**
   * Evaluate all active automations for a board against an event context.
   * For each matching automation, execute the action and create an AutomationLog.
   */
  static async evaluate(
    triggerType: string,
    context: Omit<EventContext, 'triggerType'> & { boardId: number }
  ): Promise<void> {
    const automations = await Automation.findAll({
      where: { boardId: context.boardId, isActive: true },
    });

    if (automations.length === 0) return;

    const eventContext: EventContext = { triggerType, ...context };

    for (const automation of automations) {
      const auto = automation as any;
      const matched = matches(
        { triggerType: auto.triggerType, triggerConfig: auto.triggerConfig },
        eventContext
      );

      if (!matched) {
        await AutomationLog.create({
          automationId: auto.id,
          status: 'skipped',
          triggerData: eventContext as unknown as Record<string, unknown>,
          actionResult: {},
          errorMessage: null,
          executedAt: new Date(),
        });
        continue;
      }

      const result = await execute(auto.actionType, auto.actionConfig, context);

      await AutomationLog.create({
        automationId: auto.id,
        status: result.success ? 'success' : 'failure',
        triggerData: eventContext as unknown as Record<string, unknown>,
        actionResult: result.data ?? {},
        errorMessage: result.error ?? null,
        executedAt: new Date(),
      });

      if (!result.success) {
        logger.warn(`Automation ${auto.id} failed: ${result.error}`);
      }
    }
  }
}
