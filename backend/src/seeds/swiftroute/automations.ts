import Automation from '../../models/Automation';
import { SwiftRouteContext } from './workspace';
import { SwiftRouteBoards } from './boards';

export async function seedSwiftRouteAutomations(
  ctx: SwiftRouteContext,
  boards: SwiftRouteBoards,
): Promise<void> {
  console.log('[SwiftRoute] Creating 4 automation rules...');

  // ─── 1. Delivery Confirmation ─────────────────────────────────────────────
  // When shipment status → Delivered → send confirmation SMS to recipient
  await Automation.create({
    boardId: boards.shipmentTrackerId,
    name: 'Delivery Confirmation — SMS to Recipient',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.shipmentStatusColId,
      fromAny: true,
      toValue: 'delivered',
      description: 'Fires when a shipment status changes to Delivered',
    },
    actionType: 'send_notification',
    actionConfig: {
      channel: 'sms',
      recipientType: 'shipment_recipient',
      title: 'Delivery Confirmed',
      message: [
        'Your package {{item.name}} has been delivered!',
        '',
        'Tracking: {{column.tracking_number}}',
        'Origin: {{column.origin}}',
        'Destination: {{column.destination}}',
        'Delivered on: {{column.delivery_date}}',
        'Driver: {{column.driver}}',
        '',
        'Thank you for choosing SwiftRoute!',
      ].join('\n'),
      urgency: 'low',
      alsoNotify: true,
      notifyUserIds: 'dispatcher_on_duty',
      logDelivery: true,
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 2. Exception Alert ───────────────────────────────────────────────────
  // When shipment status → Exception → notify dispatcher + create escalation ticket
  await Automation.create({
    boardId: boards.shipmentTrackerId,
    name: 'Exception Alert — Dispatcher Notification + Escalation',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.shipmentStatusColId,
      fromAny: true,
      toValue: 'exception',
      description: 'Fires when a shipment status changes to Exception',
    },
    actionType: 'send_notification',
    actionConfig: {
      notifyUserIds: [ctx.dispatchManagerId, ...ctx.dispatcherIds],
      title: 'SHIPMENT EXCEPTION — Immediate Action Required',
      message: [
        'A shipment has been flagged with an exception status.',
        '',
        'Tracking: {{item.name}}',
        'Origin: {{column.origin}}',
        'Destination: {{column.destination}}',
        'Driver: {{column.driver}}',
        'Dispatch Date: {{column.dispatch_date}}',
        '',
        'Please investigate immediately and update the shipment status.',
      ].join('\n'),
      urgency: 'high',
      createEscalationTicket: true,
      escalationConfig: {
        priority: 'critical',
        assignTo: ctx.dispatchManagerId,
        slaHours: 2,
        notifyOnBreachIds: [ctx.adminId],
      },
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 3. Route Completion ──────────────────────────────────────────────────
  // When all shipments on a route are Delivered → mark route Completed, log hours
  await Automation.create({
    boardId: boards.routeBoardId,
    name: 'Route Completion — Auto-Complete & Log Hours',
    triggerType: 'on_item_updated',
    triggerConfig: {
      conditionType: 'all_linked_items_status',
      linkedBoardId: boards.shipmentTrackerId,
      linkedStatusColumnId: boards.shipmentStatusColId,
      requiredStatus: 'delivered',
      description: 'Fires when all shipments linked to a route reach Delivered status',
    },
    actionType: 'update_status',
    actionConfig: {
      targetColumnId: boards.routeStatusColId,
      value: 'completed',
      moveToGroup: boards.routeCompletedGroupId,
      alsoNotify: true,
      notifyUserIds: [ctx.dispatchManagerId],
      notificationTitle: 'Route Completed',
      notificationMessage: [
        'Route {{item.name}} has been completed.',
        '',
        'Total Shipments: {{column.shipments}}',
        'Estimated Hours: {{column.estimated_hours}}',
        'Driver: {{column.driver}}',
        '',
        'All deliveries confirmed. Route logged for reporting.',
      ].join('\n'),
      logActivity: {
        activityType: 'route_completed',
        message: 'Route {{item.name}} completed — {{column.shipments}} shipments delivered in {{column.estimated_hours}} hours.',
      },
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 4. Maintenance Reminder ──────────────────────────────────────────────
  // When vehicle last service date > 6 months ago → flag for maintenance
  await Automation.create({
    boardId: boards.fleetTrackingId,
    name: 'Maintenance Reminder — 6-Month Service Overdue',
    triggerType: 'on_date_reached',
    triggerConfig: {
      columnId: boards.lastServiceDateColId,
      daysAfter: 180,
      description: 'Fires when vehicle last service date is more than 180 days (6 months) ago',
      onlyForStatuses: ['available', 'in_service'],
      statusColumnId: boards.vehicleStatusColId,
    },
    actionType: 'set_column_value',
    actionConfig: {
      targetColumnId: boards.vehicleStatusColId,
      value: { label: 'maintenance' },
      moveToGroup: boards.fleetMaintenanceGroupId,
      alsoNotify: true,
      notifyUserIds: [ctx.fleetManagerId],
      notificationTitle: 'Vehicle Maintenance Overdue',
      notificationMessage: [
        'Vehicle {{item.name}} ({{column.vehicle_id}}) is overdue for maintenance.',
        '',
        'Last Service: {{column.last_service_date}}',
        'Current Mileage: {{column.miles}} mi',
        'Assigned Driver: {{column.assigned_driver}}',
        '',
        'Please schedule maintenance within the next 7 days.',
      ].join('\n'),
      urgency: 'medium',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  console.log('[SwiftRoute] Created 4 automation rules');
}
