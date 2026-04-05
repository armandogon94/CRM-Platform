import Board from '../../models/Board';
import BoardGroup from '../../models/BoardGroup';
import Column from '../../models/Column';
import { TrustGuardContext } from './workspace';

export interface TrustGuardBoards {
  claimsPipelineId: number;
  policyLifecycleId: number;
  underwritingQueueId: number;
  // Column IDs — Claims Pipeline
  claimNumberColId: number;
  claimStatusColId: number;
  claimPolicyNumberColId: number;
  claimAmountColId: number;
  claimDateColId: number;
  settlementDateColId: number;
  assignedAdjusterColId: number;
  // Column IDs — Policy Lifecycle
  policyHolderColId: number;
  policyTypeColId: number;
  coverageColId: number;
  policyStatusColId: number;
  renewalDateColId: number;
  // Column IDs — Underwriting Queue
  applicantNameColId: number;
  riskLevelColId: number;
  uwStatusColId: number;
  assignedUnderwriterColId: number;
  reviewDeadlineColId: number;
  // Group IDs — Claims
  claimsNewGroupId: number;
  claimsReviewGroupId: number;
  claimsApprovedGroupId: number;
  claimsPaidGroupId: number;
  claimsDeniedGroupId: number;
  // Group IDs — Policy
  policyActiveGroupId: number;
  policyRenewalGroupId: number;
  policyExpiredGroupId: number;
  policyCancelledGroupId: number;
  // Group IDs — Underwriting
  uwSubmittedGroupId: number;
  uwReviewGroupId: number;
  uwApprovedGroupId: number;
  uwRejectedGroupId: number;
}

export async function seedTrustGuardBoards(ctx: TrustGuardContext): Promise<TrustGuardBoards> {
  console.log('[TrustGuard] Creating board templates...');

  // ─── Board 1: Claims Pipeline ──────────────────────────────────────────────
  const claimsBoard = await Board.create({
    name: 'Claims Pipeline',
    description: 'Track insurance claims from initial report through resolution and payment',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'shield-alert',
      color: '#E74C3C',
      category: 'insurance',
      defaultView: 'table',
    },
  });

  // Claims groups
  const claimsNewGroup = await BoardGroup.create({ boardId: claimsBoard.id, name: 'New Claims', color: '#579BFC', position: 0 });
  const claimsReviewGroup = await BoardGroup.create({ boardId: claimsBoard.id, name: 'Under Review', color: '#FDAB3D', position: 1 });
  const claimsApprovedGroup = await BoardGroup.create({ boardId: claimsBoard.id, name: 'Approved', color: '#00C875', position: 2 });
  const claimsPaidGroup = await BoardGroup.create({ boardId: claimsBoard.id, name: 'Paid / Settled', color: '#9B59B6', position: 3 });
  const claimsDeniedGroup = await BoardGroup.create({ boardId: claimsBoard.id, name: 'Denied', color: '#E2445C', position: 4 });

  // Claims columns
  const claimNumberCol = await Column.create({
    boardId: claimsBoard.id, name: 'Claim Number', columnType: 'text', position: 0, width: 140,
    config: { placeholder: 'CLM-XXXXX' },
  });
  const claimStatusCol = await Column.create({
    boardId: claimsBoard.id, name: 'Status', columnType: 'status', position: 1, width: 140,
    config: {
      labels: [
        { id: 'reported', text: 'Reported', color: '#579BFC' },
        { id: 'under_review', text: 'Under Review', color: '#FDAB3D' },
        { id: 'approved', text: 'Approved', color: '#00C875' },
        { id: 'paid', text: 'Paid', color: '#9B59B6' },
        { id: 'denied', text: 'Denied', color: '#E2445C' },
      ],
    },
  });
  const claimPolicyNumberCol = await Column.create({
    boardId: claimsBoard.id, name: 'Policy Number', columnType: 'text', position: 2, width: 150,
    config: { placeholder: 'POL-XXXXXXXX' },
  });
  const claimAmountCol = await Column.create({
    boardId: claimsBoard.id, name: 'Claim Amount', columnType: 'number', position: 3, width: 130,
    config: { format: 'currency', currency: 'USD', decimals: 2 },
  });
  const claimDateCol = await Column.create({
    boardId: claimsBoard.id, name: 'Claim Date', columnType: 'date', position: 4, width: 130,
  });
  const settlementDateCol = await Column.create({
    boardId: claimsBoard.id, name: 'Settlement Date', columnType: 'date', position: 5, width: 130,
  });
  const assignedAdjusterCol = await Column.create({
    boardId: claimsBoard.id, name: 'Assigned Adjuster', columnType: 'person', position: 6, width: 160,
  });

  // ─── Board 2: Policy Lifecycle ─────────────────────────────────────────────
  const policyBoard = await Board.create({
    name: 'Policy Lifecycle',
    description: 'Manage insurance policies from creation through renewal and expiration',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'file-shield',
      color: '#1E3A5F',
      category: 'insurance',
      defaultView: 'table',
    },
  });

  // Policy groups
  const policyActiveGroup = await BoardGroup.create({ boardId: policyBoard.id, name: 'Active Policies', color: '#00C875', position: 0 });
  const policyRenewalGroup = await BoardGroup.create({ boardId: policyBoard.id, name: 'Upcoming Renewals', color: '#FDAB3D', position: 1 });
  const policyExpiredGroup = await BoardGroup.create({ boardId: policyBoard.id, name: 'Expired', color: '#C4C4C4', position: 2 });
  const policyCancelledGroup = await BoardGroup.create({ boardId: policyBoard.id, name: 'Cancelled / Lapsed', color: '#E2445C', position: 3 });

  // Policy columns
  const policyHolderCol = await Column.create({
    boardId: policyBoard.id, name: 'Policy Holder', columnType: 'person', position: 0, width: 170,
  });
  const policyTypeCol = await Column.create({
    boardId: policyBoard.id, name: 'Policy Type', columnType: 'dropdown', position: 1, width: 130,
    config: {
      options: [
        { id: 'auto', text: 'Auto', color: '#579BFC' },
        { id: 'home', text: 'Home', color: '#00C875' },
        { id: 'life', text: 'Life', color: '#9B59B6' },
        { id: 'commercial', text: 'Commercial', color: '#FDAB3D' },
      ],
    },
  });
  const coverageCol = await Column.create({
    boardId: policyBoard.id, name: 'Coverage', columnType: 'number', position: 2, width: 140,
    config: { format: 'currency', currency: 'USD', decimals: 0 },
  });
  const policyStatusCol = await Column.create({
    boardId: policyBoard.id, name: 'Status', columnType: 'status', position: 3, width: 130,
    config: {
      labels: [
        { id: 'active', text: 'Active', color: '#00C875' },
        { id: 'expired', text: 'Expired', color: '#C4C4C4' },
        { id: 'cancelled', text: 'Cancelled', color: '#E2445C' },
        { id: 'lapsed', text: 'Lapsed', color: '#FDAB3D' },
      ],
    },
  });
  const renewalDateCol = await Column.create({
    boardId: policyBoard.id, name: 'Renewal Date', columnType: 'date', position: 4, width: 130,
  });

  // ─── Board 3: Underwriting Queue ──────────────────────────────────────────
  const uwBoard = await Board.create({
    name: 'Underwriting Queue',
    description: 'Review and process new insurance policy applications',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'clipboard-check',
      color: '#2D5F8A',
      category: 'insurance',
      defaultView: 'table',
    },
  });

  // Underwriting groups
  const uwSubmittedGroup = await BoardGroup.create({ boardId: uwBoard.id, name: 'Submitted', color: '#579BFC', position: 0 });
  const uwReviewGroup = await BoardGroup.create({ boardId: uwBoard.id, name: 'Under Review', color: '#FDAB3D', position: 1 });
  const uwApprovedGroup = await BoardGroup.create({ boardId: uwBoard.id, name: 'Approved', color: '#00C875', position: 2 });
  const uwRejectedGroup = await BoardGroup.create({ boardId: uwBoard.id, name: 'Rejected', color: '#E2445C', position: 3 });

  // Underwriting columns
  const applicantNameCol = await Column.create({
    boardId: uwBoard.id, name: 'Applicant Name', columnType: 'person', position: 0, width: 170,
  });
  const riskLevelCol = await Column.create({
    boardId: uwBoard.id, name: 'Risk Level', columnType: 'dropdown', position: 1, width: 120,
    config: {
      options: [
        { id: 'low', text: 'Low', color: '#00C875' },
        { id: 'medium', text: 'Medium', color: '#FDAB3D' },
        { id: 'high', text: 'High', color: '#E2445C' },
      ],
    },
  });
  const uwStatusCol = await Column.create({
    boardId: uwBoard.id, name: 'Status', columnType: 'status', position: 2, width: 140,
    config: {
      labels: [
        { id: 'submitted', text: 'Submitted', color: '#579BFC' },
        { id: 'under_review', text: 'Under Review', color: '#FDAB3D' },
        { id: 'approved', text: 'Approved', color: '#00C875' },
        { id: 'rejected', text: 'Rejected', color: '#E2445C' },
      ],
    },
  });
  const assignedUnderwriterCol = await Column.create({
    boardId: uwBoard.id, name: 'Assigned Underwriter', columnType: 'person', position: 3, width: 170,
  });
  const reviewDeadlineCol = await Column.create({
    boardId: uwBoard.id, name: 'Review Deadline', columnType: 'date', position: 4, width: 140,
  });

  console.log('[TrustGuard] Created 3 board templates with columns and groups');

  return {
    claimsPipelineId: claimsBoard.id,
    policyLifecycleId: policyBoard.id,
    underwritingQueueId: uwBoard.id,
    // Claims columns
    claimNumberColId: claimNumberCol.id,
    claimStatusColId: claimStatusCol.id,
    claimPolicyNumberColId: claimPolicyNumberCol.id,
    claimAmountColId: claimAmountCol.id,
    claimDateColId: claimDateCol.id,
    settlementDateColId: settlementDateCol.id,
    assignedAdjusterColId: assignedAdjusterCol.id,
    // Policy columns
    policyHolderColId: policyHolderCol.id,
    policyTypeColId: policyTypeCol.id,
    coverageColId: coverageCol.id,
    policyStatusColId: policyStatusCol.id,
    renewalDateColId: renewalDateCol.id,
    // Underwriting columns
    applicantNameColId: applicantNameCol.id,
    riskLevelColId: riskLevelCol.id,
    uwStatusColId: uwStatusCol.id,
    assignedUnderwriterColId: assignedUnderwriterCol.id,
    reviewDeadlineColId: reviewDeadlineCol.id,
    // Claims groups
    claimsNewGroupId: claimsNewGroup.id,
    claimsReviewGroupId: claimsReviewGroup.id,
    claimsApprovedGroupId: claimsApprovedGroup.id,
    claimsPaidGroupId: claimsPaidGroup.id,
    claimsDeniedGroupId: claimsDeniedGroup.id,
    // Policy groups
    policyActiveGroupId: policyActiveGroup.id,
    policyRenewalGroupId: policyRenewalGroup.id,
    policyExpiredGroupId: policyExpiredGroup.id,
    policyCancelledGroupId: policyCancelledGroup.id,
    // Underwriting groups
    uwSubmittedGroupId: uwSubmittedGroup.id,
    uwReviewGroupId: uwReviewGroup.id,
    uwApprovedGroupId: uwApprovedGroup.id,
    uwRejectedGroupId: uwRejectedGroup.id,
  };
}
