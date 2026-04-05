import { Automation } from '../../models';
import { TableSyncContext } from './workspace';
import { TableSyncBoards } from './boards';

export async function seedAutomations(
  ctx: TableSyncContext,
  boards: TableSyncBoards
): Promise<void> {
  console.log('[TableSync] Seeding automation rules...');

  const automations = [
    // 1. Reservation Confirmation — When status=Requested → send confirmation email/SMS
    {
      boardId: boards.reservationBoard.boardId,
      name: 'Reservation Confirmation — Auto-Send Confirmation',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.reservationBoard.columns['Status'],
        fromValue: 'Requested',
        toValue: 'Confirmed',
        description: 'When reservation status changes from Requested to Confirmed',
      },
      actionType: 'send_email' as const,
      actionConfig: {
        to: '{{Guest Name.email}}',
        subject: 'Reservation Confirmed — TableSync Restaurant',
        body: 'Dear {{item.name}},\n\nYour reservation has been confirmed!\n\nDetails:\n- Date & Time: {{Reservation Time}}\n- Party Size: {{Party Size}}\n- Table: {{Table}}\n\nSpecial notes: {{Special Notes}}\n\nWe look forward to welcoming you. If you need to modify your reservation, please call us at (555) 234-5678.\n\nBon appetit!\nTableSync Restaurant',
        template: 'reservation_confirmation',
        smsEnabled: true,
        smsMessage: 'TableSync: Your reservation for {{Party Size}} on {{Reservation Time}} is confirmed! Table {{Table}}. See you soon!',
      },
      isActive: true,
      createdBy: ctx.adminId,
    },

    // 2. Table Ready Alert — When reservation time approaching → notify host
    {
      boardId: boards.reservationBoard.boardId,
      name: 'Table Ready Alert — 30 Minute Warning',
      triggerType: 'on_date_reached' as const,
      triggerConfig: {
        columnId: boards.reservationBoard.columns['Reservation Time'],
        minutesBefore: 30,
        description: 'When reservation time is 30 minutes away, alert host to prepare the table',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.hostManagerId, ctx.serverLeadId],
        channel: 'in_app',
        message: 'TABLE PREP: {{item.name}} arriving in 30 minutes. Party of {{Party Size}} at {{Table}}. Notes: {{Special Notes}}',
        createActivity: true,
        activityType: 'table_ready_alert',
        priority: 'high',
      },
      isActive: true,
      createdBy: ctx.hostManagerId,
    },

    // 3. Staff Reminder — When shift starting in 2 hours → send reminder text
    {
      boardId: boards.staffBoard.boardId,
      name: 'Staff Shift Reminder — 2 Hour Notice',
      triggerType: 'on_date_reached' as const,
      triggerConfig: {
        columnId: boards.staffBoard.columns['Start Time'],
        minutesBefore: 120,
        description: 'When shift start time is 2 hours away, send reminder to staff member',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: ['{{Staff Member}}'],
        channel: 'sms',
        message: 'Hi {{item.name}}! Friendly reminder: your {{Role}} shift starts at {{Start Time}} today. Please confirm your attendance. — TableSync Management',
        createActivity: true,
        activityType: 'shift_reminder',
        autoUpdateStatus: {
          columnId: 'Status',
          promptValue: 'Confirmed',
        },
      },
      isActive: true,
      createdBy: ctx.gmId,
    },

    // 4. Post-Service Follow-Up — When status=Completed → send feedback survey
    {
      boardId: boards.reservationBoard.boardId,
      name: 'Post-Service Follow-Up — Send Feedback Survey',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.reservationBoard.columns['Status'],
        toValue: 'Completed',
        description: 'When reservation status changes to Completed, send follow-up survey',
      },
      actionType: 'send_email' as const,
      actionConfig: {
        to: '{{Guest Name.email}}',
        subject: 'How was your dining experience? — TableSync',
        body: 'Dear {{item.name}},\n\nThank you for dining with us! We hope you had a wonderful experience.\n\nWe\'d love to hear your feedback. Please take a moment to rate your visit:\n\n[Rate Your Experience] {{survey_link}}\n\nYour feedback helps us improve and serve you better.\n\nWarm regards,\nThe TableSync Team',
        template: 'feedback_survey',
        delayMinutes: 60,
        createActivity: true,
        activityType: 'feedback_request',
      },
      isActive: true,
      createdBy: ctx.adminId,
    },
  ];

  for (const auto of automations) {
    await Automation.create(auto);
  }

  console.log(`[TableSync] Seeded ${automations.length} automation rules`);
}
