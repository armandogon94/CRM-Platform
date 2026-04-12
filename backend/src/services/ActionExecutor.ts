import { ActionType } from '../models/Automation';
import { Notification, ColumnValue, Item, ActivityLog } from '../models';
import { logger } from '../utils/logger';

export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface ActionContext {
  boardId: number;
  itemId?: number;
  [key: string]: unknown;
}

export async function execute(
  actionType: ActionType | string,
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  try {
    switch (actionType) {
      case 'send_notification':
        return await sendNotification(config, context);
      case 'set_column_value':
        return await setColumnValue(config, context);
      case 'update_status':
        return await updateStatus(config, context);
      case 'create_activity':
        return await createActivity(config, context);
      case 'increment_number':
        return await incrementNumber(config, context);
      case 'create_subitem':
        return await createSubitem(config, context);
      case 'send_email':
        return sendEmailPlaceholder(config);
      case 'send_slack_message':
        return sendSlackPlaceholder(config);
      default:
        return { success: false, error: `Unknown action type: ${actionType}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action execution failed';
    return { success: false, error: message };
  }
}

async function sendNotification(
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  const notification = await Notification.create({
    userId: config.userId as number,
    workspaceId: config.workspaceId as number,
    title: config.title as string,
    message: (config.message as string) ?? null,
    type: (config.type as 'info' | 'success' | 'warning' | 'error') ?? 'info',
    linkUrl: (config.linkUrl as string) ?? null,
  });
  return { success: true, data: { notificationId: notification.id } };
}

async function setColumnValue(
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  const [cv] = await ColumnValue.upsert({
    itemId: context.itemId as number,
    columnId: config.columnId as number,
    value: config.value,
  } as any);
  return { success: true, data: { columnValueId: (cv as any).id } };
}

async function updateStatus(
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  const [cv] = await ColumnValue.upsert({
    itemId: context.itemId as number,
    columnId: config.columnId as number,
    value: config.status,
  } as any);
  return { success: true, data: { columnValueId: (cv as any).id } };
}

async function createActivity(
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  const log = await ActivityLog.create({
    workspaceId: config.workspaceId as number,
    userId: config.userId as number,
    entityType: 'automation',
    entityId: context.itemId ?? context.boardId,
    action: 'automation_triggered',
    changes: { message: config.message, boardId: context.boardId },
  });
  return { success: true, data: { activityLogId: (log as any).id } };
}

async function incrementNumber(
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  const columnId = config.columnId as number;
  const amount = (config.amount as number) ?? 1;

  const existing = await ColumnValue.findOne({
    where: { itemId: context.itemId, columnId },
  });

  const currentValue = existing ? (typeof existing.value === 'number' ? existing.value : 0) : 0;
  const newValue = currentValue + amount;

  const [cv] = await ColumnValue.upsert({
    itemId: context.itemId as number,
    columnId,
    value: newValue,
  } as any);

  return { success: true, data: { newValue, columnValueId: (cv as any).id } };
}

async function createSubitem(
  config: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  const parentItem = await Item.findByPk(context.itemId as number);
  if (!parentItem) {
    return { success: false, error: 'Parent item not found' };
  }

  const newItem = await Item.create({
    boardId: (parentItem as any).boardId,
    groupId: (parentItem as any).groupId,
    name: config.name as string,
    position: 0,
    createdBy: (config.createdBy as number) ?? 0,
  } as any);

  return { success: true, data: { itemId: (newItem as any).id } };
}

function sendEmailPlaceholder(config: Record<string, unknown>): ActionResult {
  logger.info(`[Automation] Email placeholder — to: ${config.to}, subject: ${config.subject}`);
  return { success: true, data: { placeholder: true, to: config.to } };
}

function sendSlackPlaceholder(config: Record<string, unknown>): ActionResult {
  logger.info(`[Automation] Slack placeholder — channel: ${config.channel}, message: ${config.message}`);
  return { success: true, data: { placeholder: true, channel: config.channel } };
}
