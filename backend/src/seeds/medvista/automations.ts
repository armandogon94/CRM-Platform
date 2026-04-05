import Automation from '../../models/Automation';
import { MedVistaContext } from './workspace';
import { MedVistaBoards } from './boards';

export async function seedMedVistaAutomations(
  ctx: MedVistaContext,
  boards: MedVistaBoards,
): Promise<void> {
  console.log('[MedVista] Seeding automations...');

  // 1. Appointment Reminder — on Appointment Scheduler board
  await Automation.create({
    boardId: boards.appointmentBoard.boardId,
    name: 'Appointment Reminder (48h)',
    triggerType: 'on_date_reached',
    triggerConfig: {
      columnName: 'Date/Time',
      offsetHours: -48,
      conditions: {
        status: ['Scheduled', 'Confirmed'],
      },
    },
    actionType: 'send_notification',
    actionConfig: {
      type: 'sms_email',
      template: 'appointment_reminder',
      message:
        'Reminder: You have an appointment at MedVista in 48 hours. Please confirm or call to reschedule.',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // 2. Insurance Claim Auto-Follow-Up — on Insurance Claims board
  await Automation.create({
    boardId: boards.claimsBoard.boardId,
    name: 'Insurance Claim Auto-Follow-Up (14 days)',
    triggerType: 'on_recurring',
    triggerConfig: {
      intervalDays: 14,
      conditions: {
        status: 'Submitted',
      },
    },
    actionType: 'send_notification',
    actionConfig: {
      type: 'email',
      recipients: ['billing'],
      template: 'claim_followup',
      message:
        'Claim has been in Submitted status for 14+ days. Please follow up with the insurance provider.',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // 3. New Patient Intake — on Patient Pipeline board
  await Automation.create({
    boardId: boards.patientBoard.boardId,
    name: 'New Patient Intake Email',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnName: 'Status',
      fromStatus: null,
      toStatus: 'New',
    },
    actionType: 'send_email',
    actionConfig: {
      template: 'patient_intake',
      subject: 'Welcome to MedVista - Pre-Registration',
      message:
        'Please complete the attached pre-registration form before your first visit.',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // 4. Discharge Notification — on Patient Pipeline board
  await Automation.create({
    boardId: boards.patientBoard.boardId,
    name: 'Discharge Notification',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnName: 'Status',
      fromStatus: 'Active',
      toStatus: 'Discharged',
    },
    actionType: 'update_status',
    actionConfig: {
      archiveFromActiveList: true,
      notifyProvider: true,
      template: 'discharge_summary',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  console.log('[MedVista] Created 4 automation rules');
}
