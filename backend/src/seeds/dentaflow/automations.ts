import Automation from '../../models/Automation';
import { DentaFlowContext } from './workspace';
import { DentaFlowBoards } from './boards';

export async function seedDentaFlowAutomations(
  ctx: DentaFlowContext,
  boards: DentaFlowBoards,
): Promise<void> {
  console.log('[DentaFlow] Creating 4 automation rules...');

  // ─── 1. Appointment Reminder ───────────────────────────────────────────────
  // 24 hours before appointment → send SMS reminder to patient
  await Automation.create({
    boardId: boards.appointmentBoardId,
    name: 'Appointment Reminder — 24-Hour SMS',
    triggerType: 'on_date_reached',
    triggerConfig: {
      columnId: boards.apptDateTimeColId,
      daysBefore: 1,
      description: 'Fires 24 hours before the scheduled appointment time',
      onlyForStatuses: ['scheduled', 'confirmed'],
      statusColumnId: boards.apptStatusColId,
    },
    actionType: 'send_notification',
    actionConfig: {
      notifyColumn: boards.apptPatientColId,
      channel: 'sms',
      title: 'Appointment Reminder',
      message: [
        'Hi {{Patient Name}}, this is a reminder from DentaFlow Dental Clinic.',
        '',
        'You have an appointment tomorrow:',
        'Date/Time: {{column.date_time}}',
        'Dentist: {{column.dentist}}',
        'Treatment: {{column.treatment}}',
        '',
        'Please reply CONFIRM to confirm or call us to reschedule.',
        'DentaFlow Dental — Smiles You Can Trust',
      ].join('\n'),
      urgency: 'medium',
      createActivity: true,
      activityType: 'appointment_reminder_sent',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 2. Treatment Plan Update — Auto-Increment Visit Count ─────────────────
  // When appointment status → Completed → increment visits completed on linked plan
  await Automation.create({
    boardId: boards.appointmentBoardId,
    name: 'Treatment Plan Update — Increment Visit Count',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.apptStatusColId,
      fromAny: true,
      toValue: 'completed',
      description: 'Fires when an appointment status changes to Completed',
    },
    actionType: 'increment_number',
    actionConfig: {
      targetBoardId: boards.treatmentPlansId,
      targetColumnId: boards.txVisitsCompletedColId,
      matchBy: {
        sourceColumn: boards.apptPatientColId,
        targetColumn: boards.txPatientColId,
      },
      incrementBy: 1,
      alsoNotify: true,
      notificationTitle: 'Visit Completed',
      notificationMessage: 'Patient {{Patient Name}} completed visit. Treatment: {{column.treatment}}. Updated treatment plan visit count.',
      notifyUserIds: [ctx.adminId, ctx.officeManagerId],
      createActivity: true,
      activityType: 'visit_completed',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 3. Payment Due — Treatment Complete → Generate Invoice ────────────────
  // When treatment plan status → Complete → generate invoice + send payment reminder
  await Automation.create({
    boardId: boards.treatmentPlansId,
    name: 'Payment Due — Generate Invoice on Completion',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.txStatusColId,
      fromAny: true,
      toValue: 'complete',
      description: 'Fires when a treatment plan status changes to Complete',
    },
    actionType: 'send_email',
    actionConfig: {
      to: 'billing@dentaflow.com',
      cc: ['office.manager@dentaflow.com'],
      subject: 'Invoice Required — Treatment Plan {{item.name}} Complete',
      body: [
        'A treatment plan has been completed and requires invoice generation.',
        '',
        'Treatment Plan: {{item.name}}',
        'Patient: {{column.patient}}',
        'Procedure: {{column.procedure}}',
        'Total Visits: {{column.total_visits}}',
        'Total Cost: ${{column.cost}}',
        '',
        'Please generate the patient invoice and send payment reminder.',
        'If insurance is on file, submit the claim to the provider.',
        '',
        '— DentaFlow Billing Automation',
      ].join('\n'),
      includeItemLink: true,
      createActivity: true,
      activityType: 'invoice_generated',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 4. Follow-Up Needed — Last Visit > 6 Months ──────────────────────────
  // When patient's last visit date exceeds 6 months → add to follow-up list
  await Automation.create({
    boardId: boards.patientPipelineId,
    name: 'Follow-Up Needed — 6-Month Recall',
    triggerType: 'on_date_reached',
    triggerConfig: {
      columnId: boards.lastVisitColId,
      daysAfter: 180,
      description: 'Fires when a patient has not visited in over 6 months',
      onlyForStatuses: ['active', 'intake_complete'],
      statusColumnId: boards.patientStatusColId,
    },
    actionType: 'send_notification',
    actionConfig: {
      recipients: [ctx.officeManagerId, ctx.frontDeskId],
      channel: 'in_app',
      title: 'Patient Follow-Up Required',
      message: [
        'Patient {{item.name}} has not visited in over 6 months.',
        '',
        'Last Visit: {{column.last_visit}}',
        'Insurance: {{column.insurance}}',
        'Treatment Type: {{column.treatment_type}}',
        '',
        'Please schedule a recall appointment and contact the patient.',
      ].join('\n'),
      urgency: 'high',
      createActivity: true,
      activityType: 'follow_up_needed',
      autoTag: 'follow-up',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  console.log('[DentaFlow] Created 4 automation rules');
}
