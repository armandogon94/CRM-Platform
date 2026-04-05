import Automation from '../../models/Automation';
import { EduPulseContext } from './workspace';
import { EduPulseBoards } from './boards';

export async function seedEduPulseAutomations(
  ctx: EduPulseContext,
  boards: EduPulseBoards,
): Promise<void> {
  console.log('[EduPulse] Creating 4 automation rules...');

  // ─── 1. Enrollment Confirmation ───────────────────────────────────────────
  // When student status changes to Enrolled → send notification to registrar & parent
  await Automation.create({
    boardId: boards.studentEnrollmentId,
    name: 'Enrollment Confirmation — Welcome Notification',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.studentStatusColId,
      fromAny: true,
      toValue: 'enrolled',
      description: 'Fires when a student status changes to Enrolled',
    },
    actionType: 'send_notification',
    actionConfig: {
      recipients: [ctx.registrarId, ctx.principalId],
      channel: 'in_app',
      title: 'New Student Enrolled',
      message: [
        'A new student has been officially enrolled at EduPulse.',
        '',
        'Student: {{item.name}}',
        'Grade Level: {{column.grade_level}}',
        'Enrollment Date: {{column.enrollment_date}}',
        'Parent Contact: {{column.parent_contact}}',
        '',
        'Please ensure the student is added to the appropriate class roster',
        'and orientation materials are sent to the family.',
        '',
        '— EduPulse Enrollment System',
      ].join('\n'),
      urgency: 'medium',
      createActivity: true,
      activityType: 'enrollment_confirmed',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 2. Assignment Due Reminder ───────────────────────────────────────────
  // 2 days before due date → notify teacher
  await Automation.create({
    boardId: boards.assignmentTrackerId,
    name: 'Assignment Due Reminder — 2-Day Notice',
    triggerType: 'on_date_reached',
    triggerConfig: {
      columnId: boards.dueDateColId,
      daysBefore: 2,
      description: 'Fires 2 days before the assignment due date',
      onlyForStatuses: ['assigned', 'in_progress'],
      statusColumnId: boards.assignmentStatusColId,
    },
    actionType: 'send_notification',
    actionConfig: {
      recipients: [ctx.deanId],
      notifyTeachers: true,
      channel: 'email',
      title: 'Assignment Due in 2 Days',
      message: [
        'Reminder: An assignment is due in 2 days.',
        '',
        'Assignment: {{item.name}}',
        'Course: {{column.course}}',
        'Due Date: {{column.due_date}}',
        'Submissions So Far: {{column.submissions}}',
        '',
        'Please ensure all students have been reminded to submit their work.',
        'Consider sending a class-wide reminder if submissions are low.',
        '',
        '— EduPulse Assignment Tracker',
      ].join('\n'),
      urgency: 'high',
      createActivity: true,
      activityType: 'due_date_reminder_sent',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 3. Low GPA Alert ────────────────────────────────────────────────────
  // When GPA falls below 2.0 → notify counselor
  await Automation.create({
    boardId: boards.studentEnrollmentId,
    name: 'Low GPA Alert — Academic Intervention Needed',
    triggerType: 'on_item_updated',
    triggerConfig: {
      columnId: boards.gpaColId,
      condition: 'less_than',
      threshold: 2.0,
      description: 'Fires when a student GPA drops below 2.0',
      onlyForStatuses: ['enrolled'],
      statusColumnId: boards.studentStatusColId,
    },
    actionType: 'send_notification',
    actionConfig: {
      recipients: [ctx.counselorId, ctx.principalId],
      channel: 'in_app',
      title: 'Low GPA Alert — Academic Intervention Required',
      message: [
        'ALERT: A student\'s GPA has fallen below the 2.0 threshold.',
        '',
        'Student: {{item.name}}',
        'Current GPA: {{column.gpa}}',
        'Grade Level: {{column.grade_level}}',
        'Parent Contact: {{column.parent_contact}}',
        '',
        'Recommended Actions:',
        '1. Schedule a meeting with the student',
        '2. Contact parent/guardian',
        '3. Develop an academic improvement plan',
        '4. Consider tutoring referral',
        '',
        '— EduPulse Academic Monitoring',
      ].join('\n'),
      urgency: 'critical',
      createActivity: true,
      activityType: 'low_gpa_alert',
      autoTag: 'academic-risk',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 4. Course Capacity Warning ──────────────────────────────────────────
  // When current enrollment >= 90% of capacity → flag the course
  await Automation.create({
    boardId: boards.courseManagementId,
    name: 'Course Capacity Warning — Near-Full Alert',
    triggerType: 'on_item_updated',
    triggerConfig: {
      columnId: boards.currentEnrollmentColId,
      condition: 'percentage_of',
      referenceColumnId: boards.enrollmentCapacityColId,
      threshold: 90,
      description: 'Fires when current enrollment reaches 90% or more of capacity',
      onlyForStatuses: ['active', 'upcoming'],
      statusColumnId: boards.courseStatusColId,
    },
    actionType: 'send_notification',
    actionConfig: {
      recipients: [ctx.deanId, ctx.registrarId],
      channel: 'in_app',
      title: 'Course Near Capacity',
      message: [
        'WARNING: A course is approaching its enrollment capacity.',
        '',
        'Course: {{item.name}}',
        'Department: {{column.department}}',
        'Current Enrollment: {{column.current_enrollment}}',
        'Capacity: {{column.enrollment_capacity}}',
        'Grade Level: {{column.grade_level}}',
        '',
        'Recommended Actions:',
        '1. Consider opening an additional section',
        '2. Review waitlist if applicable',
        '3. Notify the assigned teacher',
        '',
        '— EduPulse Course Management',
      ].join('\n'),
      urgency: 'high',
      createActivity: true,
      activityType: 'capacity_warning',
      autoTag: 'near-capacity',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  console.log('[EduPulse] Created 4 automation rules');
}
