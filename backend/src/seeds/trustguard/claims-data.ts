import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { TrustGuardContext } from './workspace';
import { TrustGuardBoards } from './boards';

// ─── 50 Claim Records ───────────────────────────────────────────────────────
// Realistic distribution across all statuses and claim types

interface ClaimRecord {
  claimantName: string;
  policyType: string;
  amount: number;
  status: string;         // reported | under_review | approved | paid | denied
  claimDate: string;
  settlementDate: string | null;
  group: 'new' | 'review' | 'approved' | 'paid' | 'denied';
}

const CLAIMS: ClaimRecord[] = [
  // ─── New / Reported (10) ────────────────────────────────────────
  { claimantName: 'James Rodriguez', policyType: 'auto', amount: 8500, status: 'reported', claimDate: '2026-03-28', settlementDate: null, group: 'new' },
  { claimantName: 'Sarah Mitchell', policyType: 'auto', amount: 3200, status: 'reported', claimDate: '2026-03-30', settlementDate: null, group: 'new' },
  { claimantName: 'Jennifer Okonkwo', policyType: 'home', amount: 45000, status: 'reported', claimDate: '2026-03-25', settlementDate: null, group: 'new' },
  { claimantName: 'Michael Chen', policyType: 'home', amount: 12800, status: 'reported', claimDate: '2026-04-01', settlementDate: null, group: 'new' },
  { claimantName: 'Greenleaf Organic Foods', policyType: 'commercial', amount: 75000, status: 'reported', claimDate: '2026-03-27', settlementDate: null, group: 'new' },
  { claimantName: 'Kevin Nakamura', policyType: 'auto', amount: 15600, status: 'reported', claimDate: '2026-03-31', settlementDate: null, group: 'new' },
  { claimantName: 'Patricia Svensson', policyType: 'home', amount: 8900, status: 'reported', claimDate: '2026-04-02', settlementDate: null, group: 'new' },
  { claimantName: 'Metropolitan Dental Group', policyType: 'commercial', amount: 125000, status: 'reported', claimDate: '2026-03-29', settlementDate: null, group: 'new' },
  { claimantName: 'Tyler Brooks', policyType: 'auto', amount: 4100, status: 'reported', claimDate: '2026-03-26', settlementDate: null, group: 'new' },
  { claimantName: 'Sandra Kimura', policyType: 'home', amount: 22000, status: 'reported', claimDate: '2026-04-01', settlementDate: null, group: 'new' },

  // ─── Under Review (12) ─────────────────────────────────────────
  { claimantName: 'Ana Gutierrez', policyType: 'auto', amount: 6700, status: 'under_review', claimDate: '2026-03-15', settlementDate: null, group: 'review' },
  { claimantName: 'Laura Petrov', policyType: 'auto', amount: 28500, status: 'under_review', claimDate: '2026-03-10', settlementDate: null, group: 'review' },
  { claimantName: 'Thomas Jefferson III', policyType: 'home', amount: 95000, status: 'under_review', claimDate: '2026-03-08', settlementDate: null, group: 'review' },
  { claimantName: 'George Abiodun', policyType: 'home', amount: 18700, status: 'under_review', claimDate: '2026-03-12', settlementDate: null, group: 'review' },
  { claimantName: 'TechVenture Labs Inc.', policyType: 'commercial', amount: 250000, status: 'under_review', claimDate: '2026-03-05', settlementDate: null, group: 'review' },
  { claimantName: 'Pacific Coast Logistics', policyType: 'commercial', amount: 340000, status: 'under_review', claimDate: '2026-03-02', settlementDate: null, group: 'review' },
  { claimantName: 'Marcus Jones', policyType: 'auto', amount: 42000, status: 'under_review', claimDate: '2026-03-18', settlementDate: null, group: 'review' },
  { claimantName: 'Elizabeth Novak', policyType: 'home', amount: 31500, status: 'under_review', claimDate: '2026-03-14', settlementDate: null, group: 'review' },
  { claimantName: 'Cascade Construction LLC', policyType: 'commercial', amount: 580000, status: 'under_review', claimDate: '2026-02-28', settlementDate: null, group: 'review' },
  { claimantName: 'Brian Foster', policyType: 'auto', amount: 11200, status: 'under_review', claimDate: '2026-03-20', settlementDate: null, group: 'review' },
  { claimantName: 'Andrew Garcia', policyType: 'home', amount: 67000, status: 'under_review', claimDate: '2026-03-06', settlementDate: null, group: 'review' },
  { claimantName: 'Harmony Music Studios', policyType: 'commercial', amount: 48000, status: 'under_review', claimDate: '2026-03-22', settlementDate: null, group: 'review' },

  // ─── Approved (8) ──────────────────────────────────────────────
  { claimantName: 'Emily Sato', policyType: 'auto', amount: 5400, status: 'approved', claimDate: '2026-02-20', settlementDate: null, group: 'approved' },
  { claimantName: 'Natalie Kim', policyType: 'auto', amount: 18900, status: 'approved', claimDate: '2026-02-15', settlementDate: null, group: 'approved' },
  { claimantName: 'Catherine Doyle', policyType: 'home', amount: 72000, status: 'approved', claimDate: '2026-02-10', settlementDate: null, group: 'approved' },
  { claimantName: 'Nancy Zhao', policyType: 'home', amount: 15300, status: 'approved', claimDate: '2026-02-25', settlementDate: null, group: 'approved' },
  { claimantName: 'Riverside Medical Center', policyType: 'commercial', amount: 425000, status: 'approved', claimDate: '2026-02-05', settlementDate: null, group: 'approved' },
  { claimantName: 'Christopher Adebayo', policyType: 'auto', amount: 7800, status: 'approved', claimDate: '2026-02-18', settlementDate: null, group: 'approved' },
  { claimantName: 'Helen Dubois', policyType: 'home', amount: 110000, status: 'approved', claimDate: '2026-02-12', settlementDate: null, group: 'approved' },
  { claimantName: 'Atlas Manufacturing Co.', policyType: 'commercial', amount: 195000, status: 'approved', claimDate: '2026-02-08', settlementDate: null, group: 'approved' },

  // ─── Paid / Settled (12) ───────────────────────────────────────
  { claimantName: 'Rachel Hoffman', policyType: 'auto', amount: 4200, status: 'paid', claimDate: '2026-01-10', settlementDate: '2026-02-28', group: 'paid' },
  { claimantName: 'Omar Hassan', policyType: 'auto', amount: 9800, status: 'paid', claimDate: '2025-12-15', settlementDate: '2026-02-10', group: 'paid' },
  { claimantName: 'Daniel Moreau', policyType: 'auto', amount: 22400, status: 'paid', claimDate: '2026-01-05', settlementDate: '2026-03-01', group: 'paid' },
  { claimantName: 'William Park', policyType: 'home', amount: 38000, status: 'paid', claimDate: '2025-11-20', settlementDate: '2026-01-30', group: 'paid' },
  { claimantName: 'Robert Whitfield', policyType: 'home', amount: 55000, status: 'paid', claimDate: '2025-12-01', settlementDate: '2026-02-15', group: 'paid' },
  { claimantName: 'BrightPath Education Corp', policyType: 'commercial', amount: 165000, status: 'paid', claimDate: '2025-10-15', settlementDate: '2026-01-20', group: 'paid' },
  { claimantName: 'Coastal Shipping Inc.', policyType: 'commercial', amount: 290000, status: 'paid', claimDate: '2025-11-05', settlementDate: '2026-02-05', group: 'paid' },
  { claimantName: 'Hannah Sullivan', policyType: 'auto', amount: 3600, status: 'paid', claimDate: '2026-01-22', settlementDate: '2026-03-10', group: 'paid' },
  { claimantName: 'Steven Yamamoto', policyType: 'home', amount: 28000, status: 'paid', claimDate: '2025-12-10', settlementDate: '2026-02-20', group: 'paid' },
  { claimantName: 'Victor Almeida', policyType: 'auto', amount: 14500, status: 'paid', claimDate: '2026-01-15', settlementDate: '2026-03-05', group: 'paid' },
  { claimantName: 'Kenneth Osei', policyType: 'home', amount: 19200, status: 'paid', claimDate: '2025-11-25', settlementDate: '2026-01-15', group: 'paid' },
  { claimantName: 'Jamal Washington', policyType: 'auto', amount: 31000, status: 'paid', claimDate: '2025-12-20', settlementDate: '2026-03-12', group: 'paid' },

  // ─── Denied (8) ────────────────────────────────────────────────
  { claimantName: 'Jason Lindqvist', policyType: 'auto', amount: 45000, status: 'denied', claimDate: '2026-01-08', settlementDate: null, group: 'denied' },
  { claimantName: 'Mia Delacroix', policyType: 'auto', amount: 12000, status: 'denied', claimDate: '2025-12-22', settlementDate: null, group: 'denied' },
  { claimantName: 'Richard Obeng', policyType: 'home', amount: 85000, status: 'denied', claimDate: '2026-01-15', settlementDate: null, group: 'denied' },
  { claimantName: 'Sterling Auto Dealership', policyType: 'commercial', amount: 750000, status: 'denied', claimDate: '2025-11-10', settlementDate: null, group: 'denied' },
  { claimantName: 'Paul Fitzgerald', policyType: 'auto', amount: 8500, status: 'denied', claimDate: '2026-02-01', settlementDate: null, group: 'denied' },
  { claimantName: 'Dorothy Hernandez', policyType: 'home', amount: 120000, status: 'denied', claimDate: '2025-12-05', settlementDate: null, group: 'denied' },
  { claimantName: 'Olivia Dunn', policyType: 'auto', amount: 16000, status: 'denied', claimDate: '2026-02-14', settlementDate: null, group: 'denied' },
  { claimantName: 'Oakwood Property Mgmt', policyType: 'commercial', amount: 320000, status: 'denied', claimDate: '2025-10-28', settlementDate: null, group: 'denied' },
];

function generateClaimNumber(index: number): string {
  return `CLM-${String(20260001 + index)}`;
}

function generatePolicyRef(index: number, policyType: string): string {
  const prefix: Record<string, string> = { auto: 'AU', home: 'HM', life: 'LF', commercial: 'CM' };
  const pfx = prefix[policyType] || 'GN';
  // Link claims to plausible policy numbers
  return `POL-${pfx}-${String(10000 + (index * 7 + 3) % 80).slice(1)}`;
}

export async function seedClaims(ctx: TrustGuardContext, boards: TrustGuardBoards): Promise<void> {
  console.log('[TrustGuard] Seeding 50 claim records...');

  const groupMap: Record<string, number> = {
    new: boards.claimsNewGroupId,
    review: boards.claimsReviewGroupId,
    approved: boards.claimsApprovedGroupId,
    paid: boards.claimsPaidGroupId,
    denied: boards.claimsDeniedGroupId,
  };

  const adjusterPool = ctx.adjusterIds;

  for (let i = 0; i < CLAIMS.length; i++) {
    const c = CLAIMS[i];
    const claimNumber = generateClaimNumber(i);
    const policyRef = generatePolicyRef(i, c.policyType);
    const assignedAdjuster = adjusterPool[i % adjusterPool.length];

    const item = await Item.create({
      boardId: boards.claimsPipelineId,
      groupId: groupMap[c.group],
      name: `${claimNumber} — ${c.claimantName}`,
      position: i,
      createdBy: ctx.claimsManagerId,
    });

    const columnValues = [
      { itemId: item.id, columnId: boards.claimNumberColId, value: { text: claimNumber } },
      { itemId: item.id, columnId: boards.claimStatusColId, value: { labelId: c.status } },
      { itemId: item.id, columnId: boards.claimPolicyNumberColId, value: { text: policyRef } },
      { itemId: item.id, columnId: boards.claimAmountColId, value: { number: c.amount } },
      { itemId: item.id, columnId: boards.claimDateColId, value: { date: c.claimDate } },
      { itemId: item.id, columnId: boards.assignedAdjusterColId, value: { userId: assignedAdjuster, displayName: '' } },
    ];

    if (c.settlementDate) {
      columnValues.push({
        itemId: item.id,
        columnId: boards.settlementDateColId,
        value: { date: c.settlementDate },
      });
    }

    await ColumnValue.bulkCreate(columnValues);
  }

  console.log(`[TrustGuard] Seeded ${CLAIMS.length} claims`);
}
