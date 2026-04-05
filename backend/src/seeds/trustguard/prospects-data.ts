import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { TrustGuardContext } from './workspace';
import { TrustGuardBoards } from './boards';

// ─── 30 Prospect / Underwriting Records ─────────────────────────────────────
// New policy applications pending underwriting review

interface ProspectRecord {
  applicantName: string;
  policyType: string;     // auto | home | life | commercial
  requestedCoverage: number;
  riskLevel: string;      // low | medium | high
  status: string;         // submitted | under_review | approved | rejected
  reviewDeadline: string;
  group: 'submitted' | 'review' | 'approved' | 'rejected';
}

const PROSPECTS: ProspectRecord[] = [
  // ─── Submitted (8) ─────────────────────────────────────────────
  { applicantName: 'Aisha Patel', policyType: 'auto', requestedCoverage: 75000, riskLevel: 'low', status: 'submitted', reviewDeadline: '2026-04-15', group: 'submitted' },
  { applicantName: 'Marcus Johansson', policyType: 'home', requestedCoverage: 400000, riskLevel: 'medium', status: 'submitted', reviewDeadline: '2026-04-12', group: 'submitted' },
  { applicantName: 'Lena Kowalczyk', policyType: 'life', requestedCoverage: 500000, riskLevel: 'low', status: 'submitted', reviewDeadline: '2026-04-18', group: 'submitted' },
  { applicantName: 'Summit Ridge Ventures LLC', policyType: 'commercial', requestedCoverage: 5000000, riskLevel: 'high', status: 'submitted', reviewDeadline: '2026-04-10', group: 'submitted' },
  { applicantName: 'Brandon Okafor-Smith', policyType: 'auto', requestedCoverage: 100000, riskLevel: 'medium', status: 'submitted', reviewDeadline: '2026-04-14', group: 'submitted' },
  { applicantName: 'Samantha Reyes', policyType: 'home', requestedCoverage: 325000, riskLevel: 'low', status: 'submitted', reviewDeadline: '2026-04-20', group: 'submitted' },
  { applicantName: 'Quantum Health Systems', policyType: 'commercial', requestedCoverage: 8000000, riskLevel: 'high', status: 'submitted', reviewDeadline: '2026-04-08', group: 'submitted' },
  { applicantName: 'Derek Williams', policyType: 'life', requestedCoverage: 250000, riskLevel: 'low', status: 'submitted', reviewDeadline: '2026-04-22', group: 'submitted' },

  // ─── Under Review (10) ─────────────────────────────────────────
  { applicantName: 'Ingrid Björk', policyType: 'auto', requestedCoverage: 50000, riskLevel: 'low', status: 'under_review', reviewDeadline: '2026-04-08', group: 'review' },
  { applicantName: 'Rafael Dominguez', policyType: 'home', requestedCoverage: 550000, riskLevel: 'medium', status: 'under_review', reviewDeadline: '2026-04-06', group: 'review' },
  { applicantName: 'Nora Achebe', policyType: 'life', requestedCoverage: 1000000, riskLevel: 'medium', status: 'under_review', reviewDeadline: '2026-04-05', group: 'review' },
  { applicantName: 'Pinnacle Retail Group', policyType: 'commercial', requestedCoverage: 3500000, riskLevel: 'high', status: 'under_review', reviewDeadline: '2026-04-04', group: 'review' },
  { applicantName: 'Tobias Engström', policyType: 'auto', requestedCoverage: 75000, riskLevel: 'high', status: 'under_review', reviewDeadline: '2026-04-07', group: 'review' },
  { applicantName: 'Maya Krishnamurthy', policyType: 'home', requestedCoverage: 275000, riskLevel: 'low', status: 'under_review', reviewDeadline: '2026-04-09', group: 'review' },
  { applicantName: 'Jordan Blake', policyType: 'life', requestedCoverage: 750000, riskLevel: 'medium', status: 'under_review', reviewDeadline: '2026-04-06', group: 'review' },
  { applicantName: 'Northern Star Logistics', policyType: 'commercial', requestedCoverage: 6000000, riskLevel: 'high', status: 'under_review', reviewDeadline: '2026-04-03', group: 'review' },
  { applicantName: 'Chelsea Moreno', policyType: 'auto', requestedCoverage: 100000, riskLevel: 'medium', status: 'under_review', reviewDeadline: '2026-04-10', group: 'review' },
  { applicantName: 'Kenji Watanabe', policyType: 'home', requestedCoverage: 450000, riskLevel: 'low', status: 'under_review', reviewDeadline: '2026-04-11', group: 'review' },

  // ─── Approved (7) ──────────────────────────────────────────────
  { applicantName: 'Fatima Al-Rashid', policyType: 'auto', requestedCoverage: 50000, riskLevel: 'low', status: 'approved', reviewDeadline: '2026-03-25', group: 'approved' },
  { applicantName: 'Oliver Nguyen', policyType: 'home', requestedCoverage: 380000, riskLevel: 'low', status: 'approved', reviewDeadline: '2026-03-20', group: 'approved' },
  { applicantName: 'Isabella Torres', policyType: 'life', requestedCoverage: 300000, riskLevel: 'low', status: 'approved', reviewDeadline: '2026-03-22', group: 'approved' },
  { applicantName: 'Clearview Analytics Corp', policyType: 'commercial', requestedCoverage: 2000000, riskLevel: 'medium', status: 'approved', reviewDeadline: '2026-03-18', group: 'approved' },
  { applicantName: 'Nathan Brooks', policyType: 'auto', requestedCoverage: 75000, riskLevel: 'low', status: 'approved', reviewDeadline: '2026-03-28', group: 'approved' },
  { applicantName: 'Sophia Andersen', policyType: 'home', requestedCoverage: 290000, riskLevel: 'medium', status: 'approved', reviewDeadline: '2026-03-24', group: 'approved' },
  { applicantName: 'Ethan Park', policyType: 'life', requestedCoverage: 500000, riskLevel: 'low', status: 'approved', reviewDeadline: '2026-03-26', group: 'approved' },

  // ─── Rejected (5) ─────────────────────────────────────────────
  { applicantName: 'Viktor Kozlov', policyType: 'auto', requestedCoverage: 150000, riskLevel: 'high', status: 'rejected', reviewDeadline: '2026-03-15', group: 'rejected' },
  { applicantName: 'Rapid Demolition Services', policyType: 'commercial', requestedCoverage: 10000000, riskLevel: 'high', status: 'rejected', reviewDeadline: '2026-03-10', group: 'rejected' },
  { applicantName: 'Denise Hawthorne', policyType: 'home', requestedCoverage: 800000, riskLevel: 'high', status: 'rejected', reviewDeadline: '2026-03-12', group: 'rejected' },
  { applicantName: 'Apex Pyrotechnics Inc.', policyType: 'commercial', requestedCoverage: 15000000, riskLevel: 'high', status: 'rejected', reviewDeadline: '2026-03-08', group: 'rejected' },
  { applicantName: 'Craig Morrison', policyType: 'life', requestedCoverage: 2000000, riskLevel: 'high', status: 'rejected', reviewDeadline: '2026-03-14', group: 'rejected' },
];

export async function seedProspects(ctx: TrustGuardContext, boards: TrustGuardBoards): Promise<void> {
  console.log('[TrustGuard] Seeding 30 prospect / underwriting records...');

  const groupMap: Record<string, number> = {
    submitted: boards.uwSubmittedGroupId,
    review: boards.uwReviewGroupId,
    approved: boards.uwApprovedGroupId,
    rejected: boards.uwRejectedGroupId,
  };

  const underwriterPool = [ctx.seniorUnderwriterId, ...ctx.underwriterIds];

  for (let i = 0; i < PROSPECTS.length; i++) {
    const p = PROSPECTS[i];
    const assignedUW = underwriterPool[i % underwriterPool.length];

    const item = await Item.create({
      boardId: boards.underwritingQueueId,
      groupId: groupMap[p.group],
      name: `UW-${String(3001 + i)} — ${p.applicantName}`,
      position: i,
      createdBy: ctx.adminId,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.applicantNameColId, value: { userId: assignedUW, displayName: p.applicantName } },
      { itemId: item.id, columnId: boards.riskLevelColId, value: { selectedId: p.riskLevel } },
      { itemId: item.id, columnId: boards.uwStatusColId, value: { labelId: p.status } },
      { itemId: item.id, columnId: boards.assignedUnderwriterColId, value: { userId: assignedUW, displayName: '' } },
      { itemId: item.id, columnId: boards.reviewDeadlineColId, value: { date: p.reviewDeadline } },
    ]);
  }

  console.log(`[TrustGuard] Seeded ${PROSPECTS.length} prospects`);
}
