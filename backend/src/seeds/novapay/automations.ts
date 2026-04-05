import { Automation } from '../../models';
import { NovaPayContext } from './workspace';
import { NovaPayBoards } from './boards';

export async function seedAutomations(
  ctx: NovaPayContext,
  boards: NovaPayBoards
): Promise<void> {
  console.log('[NovaPay] Seeding automation rules...');

  const automations = [
    // 1. High-Risk Transaction Alert
    {
      boardId: boards.transactionBoard.boardId,
      name: 'High-Risk Transaction Alert',
      triggerType: 'on_item_updated' as const,
      triggerConfig: {
        columnId: boards.transactionBoard.columns['Risk Score'],
        condition: 'greater_than',
        value: 80,
        description: 'When risk score exceeds 80 on any transaction',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.riskAnalystId, ctx.complianceOfficerId],
        channel: 'slack',
        message: 'HIGH RISK ALERT: Transaction {{item.name}} has risk score {{Risk Score}}. Merchant: {{Merchant}}. Amount: ${{Amount}}. Immediate review required.',
        createActivity: true,
        activityType: 'risk_alert',
        priority: 'critical',
      },
      isActive: true,
      createdBy: ctx.adminId,
    },

    // 2. Settlement Completion Notification
    {
      boardId: boards.transactionBoard.boardId,
      name: 'Settlement Completion — Notify Account Manager',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.transactionBoard.columns['Status'],
        fromValue: 'Processing',
        toValue: 'Settled',
        description: 'When transaction status changes to Settled',
      },
      actionType: 'send_email' as const,
      actionConfig: {
        to: '{{Account Manager.email}}',
        subject: 'Settlement Complete: {{item.name}}',
        body: 'Transaction {{item.name}} for merchant {{Merchant}} has been settled. Amount: ${{Amount}}. Settlement batch processed successfully.',
        template: 'settlement_complete',
      },
      isActive: true,
      createdBy: ctx.adminId,
    },

    // 3. Compliance Review Reminder
    {
      boardId: boards.complianceBoard.boardId,
      name: 'Compliance Review Reminder — 7 Day Warning',
      triggerType: 'on_date_reached' as const,
      triggerConfig: {
        columnId: boards.complianceBoard.columns['Due Date'],
        daysBefore: 7,
        description: 'When compliance due date is within 7 days',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.complianceOfficerId],
        channel: 'in_app',
        message: 'REMINDER: Compliance case "{{item.name}}" is due in 7 days ({{Due Date}}). Case type: {{Case Type}}. Priority: {{Priority}}.',
        createActivity: true,
        activityType: 'compliance_reminder',
      },
      isActive: true,
      createdBy: ctx.complianceOfficerId,
    },

    // 4. KYC Verification Status Update
    {
      boardId: boards.onboardingBoard.boardId,
      name: 'KYC Status Change — Update Risk Assessment',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.onboardingBoard.columns['Application Status'],
        toValue: 'KYC Verified',
        description: 'When merchant onboarding status changes to KYC Verified',
      },
      actionType: 'create_activity' as const,
      actionConfig: {
        activityType: 'kyc_verified',
        message: 'KYC verification completed for {{Company Name}}. Risk assessment: {{Risk Assessment}}. Proceeding to contract phase.',
        notifyUsers: [ctx.managerId, ctx.complianceOfficerId],
        setColumnValue: {
          columnId: boards.onboardingBoard.columns['Compliance Notes'],
          appendText: '\n[AUTO] KYC verified on {{current_date}}. Ready for contract signing.',
        },
      },
      isActive: true,
      createdBy: ctx.adminId,
    },

    // 5. Fraud Alert Escalation
    {
      boardId: boards.transactionBoard.boardId,
      name: 'Fraud Alert — Auto-Escalate Disputed Transactions',
      triggerType: 'on_status_changed' as const,
      triggerConfig: {
        columnId: boards.transactionBoard.columns['Status'],
        toValue: 'Disputed',
        description: 'When any transaction is marked as Disputed',
      },
      actionType: 'send_notification' as const,
      actionConfig: {
        recipients: [ctx.riskAnalystId, ctx.complianceOfficerId, ctx.managerId],
        channel: 'slack',
        message: 'DISPUTE ALERT: Transaction {{item.name}} has been disputed. Amount: ${{Amount}}. Merchant: {{Merchant}}. Risk score: {{Risk Score}}. Chargeback investigation required.',
        createActivity: true,
        activityType: 'dispute_alert',
        priority: 'high',
        autoCreateComplianceCase: true,
      },
      isActive: true,
      createdBy: ctx.adminId,
    },
  ];

  for (const auto of automations) {
    await Automation.create(auto);
  }

  console.log(`[NovaPay] Seeded ${automations.length} automation rules`);
}
