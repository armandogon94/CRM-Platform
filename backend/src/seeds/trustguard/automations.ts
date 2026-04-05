import Automation from '../../models/Automation';
import { TrustGuardContext } from './workspace';
import { TrustGuardBoards } from './boards';

export async function seedTrustGuardAutomations(
  ctx: TrustGuardContext,
  boards: TrustGuardBoards,
): Promise<void> {
  console.log('[TrustGuard] Creating 4 automation rules...');

  // ─── 1. Claims Approval Alert ──────────────────────────────────────────────
  // When claim status → Approved → send payment instruction email to finance
  await Automation.create({
    boardId: boards.claimsPipelineId,
    name: 'Claims Approval Alert — Send Payment Instruction',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.claimStatusColId,
      fromAny: true,
      toValue: 'approved',
      description: 'Fires when a claim status changes to Approved',
    },
    actionType: 'send_email',
    actionConfig: {
      to: 'finance@trustguard.com',
      cc: ['claims.manager@trustguard.com'],
      subject: 'Payment Instruction Required — Claim {{item.name}} Approved',
      body: [
        'A claim has been approved and requires payment processing.',
        '',
        'Claim: {{item.name}}',
        'Amount: ${{column.claim_amount}}',
        'Policy: {{column.policy_number}}',
        'Adjuster: {{column.assigned_adjuster}}',
        '',
        'Please process payment within 5 business days.',
        '',
        '— TrustGuard Claims Automation',
      ].join('\n'),
      includeItemLink: true,
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 2. Policy Renewal Reminder ────────────────────────────────────────────
  // When renewal date is within 30 days → send notification to policy holder
  await Automation.create({
    boardId: boards.policyLifecycleId,
    name: 'Policy Renewal Reminder — 30 Day Notice',
    triggerType: 'on_date_reached',
    triggerConfig: {
      columnId: boards.renewalDateColId,
      daysBefore: 30,
      description: 'Fires 30 days before the policy renewal date',
      onlyForStatuses: ['active'],
      statusColumnId: boards.policyStatusColId,
    },
    actionType: 'send_notification',
    actionConfig: {
      notifyColumn: boards.policyHolderColId,
      additionalRecipients: ['agent'],
      title: 'Policy Renewal Coming Up',
      message: [
        'Your policy {{item.name}} is due for renewal on {{column.renewal_date}}.',
        '',
        'Policy Type: {{column.policy_type}}',
        'Current Coverage: ${{column.coverage}}',
        '',
        'Please contact your TrustGuard agent to review your coverage options.',
      ].join('\n'),
      urgency: 'medium',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 3. High-Risk Escalation ───────────────────────────────────────────────
  // When risk level = High → reassign to senior underwriter + notify
  await Automation.create({
    boardId: boards.underwritingQueueId,
    name: 'High-Risk Escalation — Senior Underwriter Assignment',
    triggerType: 'on_item_updated',
    triggerConfig: {
      columnId: boards.riskLevelColId,
      conditionType: 'equals',
      conditionValue: 'high',
      description: 'Fires when an application risk level is set to High',
    },
    actionType: 'set_column_value',
    actionConfig: {
      targetColumnId: boards.assignedUnderwriterColId,
      value: { userId: ctx.seniorUnderwriterId, displayName: 'William Tanaka' },
      alsoNotify: true,
      notificationTitle: 'High-Risk Application Escalated',
      notificationMessage: [
        'Application {{item.name}} has been flagged as HIGH RISK.',
        '',
        'This application has been automatically escalated to the Senior Underwriter.',
        'Please review within the deadline: {{column.review_deadline}}.',
      ].join('\n'),
      notifyUserIds: [ctx.seniorUnderwriterId, ctx.adminId],
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 4. Claims Payment Completion ─────────────────────────────────────────
  // When claim status → Paid → archive claim, update records
  await Automation.create({
    boardId: boards.claimsPipelineId,
    name: 'Claims Payment Completion — Archive & Update',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.claimStatusColId,
      fromAny: true,
      toValue: 'paid',
      description: 'Fires when a claim status changes to Paid',
    },
    actionType: 'create_activity',
    actionConfig: {
      activityType: 'claim_settled',
      logMessage: 'Claim {{item.name}} has been paid and settled. Amount: ${{column.claim_amount}}.',
      archiveItem: true,
      moveToGroup: boards.claimsPaidGroupId,
      updateLinkedBoard: {
        boardId: boards.policyLifecycleId,
        matchColumn: boards.claimPolicyNumberColId,
        logActivity: 'Claim settled — ${{column.claim_amount}} paid on {{now}}',
      },
      sendConfirmation: {
        to: 'claims.manager@trustguard.com',
        subject: 'Claim Settled — {{item.name}}',
        body: 'Claim {{item.name}} has been marked as Paid. The claim has been archived and policy records updated.',
      },
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  console.log('[TrustGuard] Created 4 automation rules');
}
