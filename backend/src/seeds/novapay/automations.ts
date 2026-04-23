import { Automation, Board, Column, User, Workspace } from '../../models';
import { NovaPayContext, NOVAPAY_E2E_EMAIL, NOVAPAY_E2E_WORKSPACE_SLUG } from './workspace';
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

/**
 * Seeds the Slice 19 Flow 5 automation:
 *   "On Status = Flagged → create in-app notification for the E2E user"
 *
 * Scope: fixture workspace only. The Playwright suite resets this workspace
 * between runs (see `E2EResetService`), so a self-contained rule is required
 * to keep the main NovaPay demo untouched by E2E side effects.
 *
 * Idempotency: keyed on `(boardId, triggerType, triggerConfig.toStatus)` so
 * repeated `seedNovaPay()` calls or re-seeds from the reset service never
 * produce duplicate rules. Also creates (or reuses) a minimal fixture board
 * with a Status column — this is the board the Playwright spec targets.
 *
 * Field contract follows `Automation.ts` + `TriggerEvaluator.matchStatusChanged`
 * + `ActionExecutor.sendNotification` (trigger = `on_status_changed`,
 * action = `send_notification`).
 */
export async function seedNovaPayE2eFlaggedAutomation(): Promise<void> {
  console.log('[NovaPay] Seeding E2E fixture Flagged→notification automation...');

  const fixtureWorkspace = await Workspace.findOne({
    where: { slug: NOVAPAY_E2E_WORKSPACE_SLUG },
  });
  if (!fixtureWorkspace) {
    // seedNovaPayE2eFixture (Task B1) must run before this; bail loudly
    // rather than silently seeding an orphaned rule.
    console.warn('[NovaPay] Fixture workspace not found — skipping E2E automation');
    return;
  }

  const e2eUser = await User.findOne({ where: { email: NOVAPAY_E2E_EMAIL } });
  if (!e2eUser) {
    console.warn('[NovaPay] E2E user not found — skipping E2E automation');
    return;
  }

  // A self-contained "Transaction Pipeline" board inside the fixture workspace.
  // The E2E spec (Flow 5) drives Status transitions on this board's items.
  const [fixtureBoard] = await Board.findOrCreate({
    where: { workspaceId: fixtureWorkspace.id, name: 'Transaction Pipeline' },
    defaults: {
      name: 'Transaction Pipeline',
      description: 'E2E fixture board — resets between Playwright runs.',
      workspaceId: fixtureWorkspace.id,
      createdBy: e2eUser.id,
      boardType: 'main',
      settings: { icon: 'credit-card', color: '#2563EB' },
    },
  });

  const [statusColumn] = await Column.findOrCreate({
    where: { boardId: fixtureBoard.id, name: 'Status' },
    defaults: {
      boardId: fixtureBoard.id,
      name: 'Status',
      columnType: 'status',
      position: 0,
      width: 140,
      config: {
        options: [
          { label: 'New', color: '#FCD34D', order: 0 },
          { label: 'In Progress', color: '#60A5FA', order: 1 },
          { label: 'Flagged', color: '#F87171', order: 2 },
          { label: 'Resolved', color: '#34D399', order: 3 },
        ],
        default_option: 'New',
      },
    },
  });

  // Idempotency guard — keyed on the semantic shape of the rule, not name.
  const existing = await Automation.findAll({
    where: {
      boardId: fixtureBoard.id,
      triggerType: 'on_status_changed',
    },
  });

  /**
   * Narrowing helper so the idempotency guard doesn't silently misread
   * a future trigger-config schema change. If the JSONB shape ever
   * evolves (e.g. `toStatus` renamed to `toValue`) this check will
   * return false for every row, re-seed will run, and the unique-ish
   * automation will appear twice — easy to spot vs. a silent no-op.
   */
  const isFlaggedRule = (raw: unknown): boolean => {
    if (raw === null || typeof raw !== 'object') return false;
    const cfg = raw as Record<string, unknown>;
    return cfg.toStatus === 'Flagged' && cfg.columnId === statusColumn.id;
  };
  const alreadySeeded = existing.some((rule) => isFlaggedRule(rule.triggerConfig));
  if (alreadySeeded) {
    console.log('[NovaPay] E2E Flagged automation already present — skipping');
    return;
  }

  await Automation.create({
    boardId: fixtureBoard.id,
    name: 'E2E Fixture — On Status=Flagged → Notify E2E User',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: statusColumn.id,
      toStatus: 'Flagged',
      description: 'Flow 5 of Slice 19 E2E suite — fires on any fixture item set to Flagged.',
    },
    actionType: 'send_notification',
    actionConfig: {
      userId: e2eUser.id,
      workspaceId: fixtureWorkspace.id,
      title: 'Item flagged',
      message: 'A fixture item was flagged and requires review.',
      type: 'warning',
    },
    isActive: true,
    createdBy: e2eUser.id,
  });

  console.log(
    `[NovaPay] Seeded E2E Flagged automation (boardId=${fixtureBoard.id}, userId=${e2eUser.id})`
  );
}
