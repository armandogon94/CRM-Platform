import { Automation } from '../../models';
import { JurisPathContext } from './workspace';
import { JurisPathBoards } from './boards';

export async function seedAutomations(
  ctx: JurisPathContext,
  boards: JurisPathBoards
): Promise<void> {
  console.log('[JurisPath] Seeding automation rules...');

  const automations = [
    // 1. Document Due Diligence — When case status changes, add tasks for next phase
    {
      boardId: boards.caseBoard.boardId,
      name: 'Document Due Diligence — Phase Transition Tasks',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.caseBoard.columns['Status'],
        description: 'When case status changes to any new phase',
      },
      actionType: 'create_activity' as const,
      actionConfig: {
        activityType: 'phase_transition',
        message: 'Case "{{item.name}}" has moved to {{Status}}. Phase-specific tasks generated:\n\n' +
          '- Review and update document index\n' +
          '- Notify lead attorney {{Lead Attorney}} of phase change\n' +
          '- Schedule team review meeting within 48 hours\n' +
          '- Update client {{Client}} on case progress\n' +
          '- Verify all prior-phase deadlines met',
        notifyUsers: [ctx.managingPartnerId, ctx.paralegalId],
        phaseTaskMapping: {
          'Discovery': ['Issue preservation hold notice', 'Prepare document review protocol', 'Send interrogatories', 'Schedule depositions', 'Engage e-discovery vendor if needed'],
          'Motions': ['Draft motion brief', 'Compile supporting exhibits', 'Prepare hearing schedule', 'Research opposing case law', 'File and serve motion'],
          'Trial': ['Prepare witness list', 'Finalize exhibit binder', 'Draft jury instructions', 'Schedule mock trial', 'Prepare opening statement outline'],
          'Closed': ['Generate final invoice', 'Archive case files', 'Send closing letter to client', 'Update conflict database', 'Complete matter closing checklist'],
        },
      },
      isActive: true,
      createdBy: ctx.adminId,
    },

    // 2. Invoice Reminder — When invoice status=Sent and >30 days old
    {
      boardId: boards.billingBoard.boardId,
      name: 'Invoice Reminder — 30 Day Follow-Up',
      triggerType: 'on_date_reached' as const,
      triggerConfig: {
        columnId: boards.billingBoard.columns['Due Date'],
        daysAfter: 0,
        condition: 'status_equals',
        statusColumnId: boards.billingBoard.columns['Status'],
        statusValue: 'Sent',
        description: 'When invoice due date is reached and status is still Sent',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.billingManagerId],
        channel: 'email',
        message: 'PAYMENT REMINDER: Invoice {{Invoice Number}} for client {{Client}} is now due.\n\n' +
          'Amount: ${{Amount}}\n' +
          'Hours billed: {{Hours}}\n' +
          'Matter: {{Matter Reference}}\n' +
          'Due Date: {{Due Date}}\n\n' +
          'Please follow up with the client regarding payment. If unpaid after 30 days, escalate to collections.',
        createActivity: true,
        activityType: 'payment_reminder',
        autoUpdateStatus: {
          afterDays: 30,
          newStatus: 'Overdue',
          columnId: boards.billingBoard.columns['Status'],
        },
      },
      isActive: true,
      createdBy: ctx.billingManagerId,
    },

    // 3. Conflict Check — When new client added, flag potential conflicts
    {
      boardId: boards.intakeBoard.boardId,
      name: 'Conflict Check — New Client Screening',
      triggerType: 'on_item_created' as const,
      triggerConfig: {
        description: 'When a new client record is created in Client Intake board',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.adminId, ctx.managingPartnerId, ctx.paralegalId],
        channel: 'in_app',
        message: 'CONFLICT CHECK REQUIRED: New client "{{Client Name}}" added to intake.\n\n' +
          'Matter Type: {{Matter Type}}\n' +
          'Contact: {{Contact Info}}\n\n' +
          'Action Required:\n' +
          '1. Search existing client database for name matches\n' +
          '2. Check adverse party lists across all active cases\n' +
          '3. Review attorney personal conflict disclosures\n' +
          '4. Document results in intake notes\n' +
          '5. Clear or escalate within 24 hours',
        createActivity: true,
        activityType: 'conflict_check',
        priority: 'high',
        conflictCheckProcess: {
          searchFields: ['Client Name', 'Contact Info'],
          crossReferenceBoards: ['Case Management'],
          notifyOnMatch: true,
          blockEngagementUntilCleared: true,
        },
      },
      isActive: true,
      createdBy: ctx.adminId,
    },

    // 4. Case Closure — Archive, generate final invoice, send thank-you
    {
      boardId: boards.caseBoard.boardId,
      name: 'Case Closure — Archive & Final Processing',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.caseBoard.columns['Status'],
        toValue: 'Closed',
        description: 'When case status is changed to Closed',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.managingPartnerId, ctx.billingManagerId, ctx.paralegalId],
        channel: 'email',
        message: 'CASE CLOSED: "{{item.name}}" has been marked as Closed.\n\n' +
          'Case Type: {{Case Type}}\n' +
          'Lead Attorney: {{Lead Attorney}}\n' +
          'Filing Date: {{Filing Date}}\n' +
          'Completion Date: {{Completion Date}}\n\n' +
          'Automated closure tasks initiated:\n' +
          '1. Final invoice generation requested → Billing team notified\n' +
          '2. Case archive process started → Files will be moved to long-term storage\n' +
          '3. Client thank-you letter queued → Template selected based on case type\n' +
          '4. Conflict database updated → Client and adverse parties logged\n' +
          '5. Matter closing checklist created → Paralegal assigned for completion',
        createActivity: true,
        activityType: 'case_closure',
        closureWorkflow: {
          generateFinalInvoice: true,
          archiveCaseFiles: true,
          sendThankYouLetter: true,
          updateConflictDatabase: true,
          createClosingChecklist: true,
          retentionPeriod: '7 years',
        },
      },
      isActive: true,
      createdBy: ctx.adminId,
    },
  ];

  for (const auto of automations) {
    await Automation.create(auto);
  }

  console.log(`[JurisPath] Seeded ${automations.length} automation rules`);
}
