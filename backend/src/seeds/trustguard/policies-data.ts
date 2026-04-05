import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { TrustGuardContext } from './workspace';
import { TrustGuardBoards } from './boards';

// ─── 80 Policy Records ──────────────────────────────────────────────────────
// Realistic mix: ~30 Auto, ~20 Home, ~15 Life, ~15 Commercial
// Statuses: ~55 Active, ~10 Renewal due, ~10 Expired, ~5 Cancelled/Lapsed

interface PolicyRecord {
  name: string;           // Policy holder display name
  policyType: string;     // auto | home | life | commercial
  coverage: number;       // USD coverage amount
  status: string;         // active | expired | cancelled | lapsed
  renewalDate: string;    // YYYY-MM-DD
  group: 'active' | 'renewal' | 'expired' | 'cancelled';
}

const POLICIES: PolicyRecord[] = [
  // ─── Auto Policies (30) ─────────────────────────────────────────
  { name: 'James Rodriguez', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-11-15', group: 'active' },
  { name: 'Sarah Mitchell', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2026-09-20', group: 'active' },
  { name: 'David Chang', policyType: 'auto', coverage: 100000, status: 'active', renewalDate: '2027-01-05', group: 'active' },
  { name: 'Michelle Okafor', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-08-12', group: 'active' },
  { name: 'Tyler Brooks', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2026-12-30', group: 'active' },
  { name: 'Ana Gutierrez', policyType: 'auto', coverage: 100000, status: 'active', renewalDate: '2027-03-18', group: 'active' },
  { name: 'Kevin Nakamura', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-10-22', group: 'active' },
  { name: 'Laura Petrov', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2027-02-14', group: 'active' },
  { name: 'Marcus Jones', policyType: 'auto', coverage: 150000, status: 'active', renewalDate: '2026-07-08', group: 'active' },
  { name: 'Emily Sato', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-11-03', group: 'active' },
  { name: 'Brian Foster', policyType: 'auto', coverage: 100000, status: 'active', renewalDate: '2027-04-25', group: 'active' },
  { name: 'Natalie Kim', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2026-06-17', group: 'active' },
  { name: 'Christopher Adebayo', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-08-29', group: 'active' },
  { name: 'Rachel Hoffman', policyType: 'auto', coverage: 100000, status: 'active', renewalDate: '2027-01-20', group: 'active' },
  { name: 'Omar Hassan', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2026-10-11', group: 'active' },
  { name: 'Stephanie Reeves', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-04-28', group: 'renewal' },
  { name: 'Daniel Moreau', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2026-04-15', group: 'renewal' },
  { name: 'Grace Nwosu', policyType: 'auto', coverage: 100000, status: 'active', renewalDate: '2026-04-22', group: 'renewal' },
  { name: 'Jason Lindqvist', policyType: 'auto', coverage: 50000, status: 'expired', renewalDate: '2026-02-10', group: 'expired' },
  { name: 'Mia Delacroix', policyType: 'auto', coverage: 75000, status: 'expired', renewalDate: '2026-01-05', group: 'expired' },
  { name: 'Paul Fitzgerald', policyType: 'auto', coverage: 50000, status: 'expired', renewalDate: '2025-12-15', group: 'expired' },
  { name: 'Yuki Tanaka', policyType: 'auto', coverage: 100000, status: 'cancelled', renewalDate: '2026-09-01', group: 'cancelled' },
  { name: 'Carlos Mendez', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-12-12', group: 'active' },
  { name: 'Amy Bergstrom', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2027-05-06', group: 'active' },
  { name: 'Jamal Washington', policyType: 'auto', coverage: 150000, status: 'active', renewalDate: '2026-09-14', group: 'active' },
  { name: 'Hannah Sullivan', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-11-28', group: 'active' },
  { name: 'Victor Almeida', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2027-03-02', group: 'active' },
  { name: 'Olivia Dunn', policyType: 'auto', coverage: 100000, status: 'lapsed', renewalDate: '2026-03-01', group: 'cancelled' },
  { name: 'Isaac Cohen', policyType: 'auto', coverage: 50000, status: 'active', renewalDate: '2026-07-19', group: 'active' },
  { name: 'Sophia Patel', policyType: 'auto', coverage: 75000, status: 'active', renewalDate: '2026-10-05', group: 'active' },

  // ─── Home Policies (20) ─────────────────────────────────────────
  { name: 'Robert & Lisa Whitfield', policyType: 'home', coverage: 350000, status: 'active', renewalDate: '2026-12-01', group: 'active' },
  { name: 'Jennifer Okonkwo', policyType: 'home', coverage: 275000, status: 'active', renewalDate: '2027-02-28', group: 'active' },
  { name: 'Michael & Priya Chen', policyType: 'home', coverage: 500000, status: 'active', renewalDate: '2026-08-15', group: 'active' },
  { name: 'Elizabeth Novak', policyType: 'home', coverage: 225000, status: 'active', renewalDate: '2026-10-30', group: 'active' },
  { name: 'Thomas Jefferson III', policyType: 'home', coverage: 750000, status: 'active', renewalDate: '2027-01-12', group: 'active' },
  { name: 'Sandra Kimura', policyType: 'home', coverage: 300000, status: 'active', renewalDate: '2026-06-05', group: 'active' },
  { name: 'Andrew & Maria Garcia', policyType: 'home', coverage: 425000, status: 'active', renewalDate: '2026-09-18', group: 'active' },
  { name: 'Patricia Svensson', policyType: 'home', coverage: 200000, status: 'active', renewalDate: '2026-11-22', group: 'active' },
  { name: 'George Abiodun', policyType: 'home', coverage: 350000, status: 'active', renewalDate: '2027-04-10', group: 'active' },
  { name: 'Catherine Doyle', policyType: 'home', coverage: 550000, status: 'active', renewalDate: '2026-04-20', group: 'renewal' },
  { name: 'William & Rose Park', policyType: 'home', coverage: 400000, status: 'active', renewalDate: '2026-04-08', group: 'renewal' },
  { name: 'Margaret Ivanova', policyType: 'home', coverage: 300000, status: 'active', renewalDate: '2026-04-30', group: 'renewal' },
  { name: 'Richard Obeng', policyType: 'home', coverage: 275000, status: 'expired', renewalDate: '2026-01-20', group: 'expired' },
  { name: 'Dorothy Hernandez', policyType: 'home', coverage: 325000, status: 'expired', renewalDate: '2025-11-30', group: 'expired' },
  { name: 'Franklin Bauer', policyType: 'home', coverage: 450000, status: 'cancelled', renewalDate: '2026-07-15', group: 'cancelled' },
  { name: 'Nancy Zhao', policyType: 'home', coverage: 375000, status: 'active', renewalDate: '2026-08-25', group: 'active' },
  { name: 'Kenneth Osei', policyType: 'home', coverage: 250000, status: 'active', renewalDate: '2027-05-14', group: 'active' },
  { name: 'Helen Dubois', policyType: 'home', coverage: 600000, status: 'active', renewalDate: '2026-12-18', group: 'active' },
  { name: 'Steven Yamamoto', policyType: 'home', coverage: 350000, status: 'active', renewalDate: '2026-07-30', group: 'active' },
  { name: 'Barbara Kowalski', policyType: 'home', coverage: 280000, status: 'active', renewalDate: '2027-03-22', group: 'active' },

  // ─── Life Policies (15) ─────────────────────────────────────────
  { name: 'Edward Sullivan', policyType: 'life', coverage: 500000, status: 'active', renewalDate: '2027-06-01', group: 'active' },
  { name: 'Janet Abrams', policyType: 'life', coverage: 250000, status: 'active', renewalDate: '2027-08-15', group: 'active' },
  { name: 'Raymond Okafor', policyType: 'life', coverage: 1000000, status: 'active', renewalDate: '2027-01-30', group: 'active' },
  { name: 'Donna Christensen', policyType: 'life', coverage: 750000, status: 'active', renewalDate: '2026-11-10', group: 'active' },
  { name: 'Harold Kim', policyType: 'life', coverage: 500000, status: 'active', renewalDate: '2027-04-22', group: 'active' },
  { name: 'Ruth Mbeki', policyType: 'life', coverage: 300000, status: 'active', renewalDate: '2026-09-05', group: 'active' },
  { name: 'Arthur Magnusson', policyType: 'life', coverage: 2000000, status: 'active', renewalDate: '2027-07-18', group: 'active' },
  { name: 'Gloria Fernandez', policyType: 'life', coverage: 500000, status: 'active', renewalDate: '2026-04-12', group: 'renewal' },
  { name: 'Albert Nguyen', policyType: 'life', coverage: 350000, status: 'active', renewalDate: '2026-04-25', group: 'renewal' },
  { name: 'Beverly Odom', policyType: 'life', coverage: 750000, status: 'expired', renewalDate: '2026-02-28', group: 'expired' },
  { name: 'Lawrence Johansson', policyType: 'life', coverage: 500000, status: 'lapsed', renewalDate: '2025-10-15', group: 'cancelled' },
  { name: 'Diane Watanabe', policyType: 'life', coverage: 250000, status: 'active', renewalDate: '2027-02-10', group: 'active' },
  { name: 'Eugene Adeyemi', policyType: 'life', coverage: 1500000, status: 'active', renewalDate: '2026-12-05', group: 'active' },
  { name: 'Christine Laurent', policyType: 'life', coverage: 400000, status: 'active', renewalDate: '2027-05-28', group: 'active' },
  { name: 'Philip Rao', policyType: 'life', coverage: 600000, status: 'active', renewalDate: '2026-08-20', group: 'active' },

  // ─── Commercial Policies (15) ──────────────────────────────────
  { name: 'TechVenture Labs Inc.', policyType: 'commercial', coverage: 2000000, status: 'active', renewalDate: '2026-10-01', group: 'active' },
  { name: 'Pacific Coast Logistics', policyType: 'commercial', coverage: 5000000, status: 'active', renewalDate: '2027-01-15', group: 'active' },
  { name: 'Greenleaf Organic Foods', policyType: 'commercial', coverage: 1500000, status: 'active', renewalDate: '2026-07-22', group: 'active' },
  { name: 'Metropolitan Dental Group', policyType: 'commercial', coverage: 3000000, status: 'active', renewalDate: '2026-11-30', group: 'active' },
  { name: 'Cascade Construction LLC', policyType: 'commercial', coverage: 10000000, status: 'active', renewalDate: '2027-03-08', group: 'active' },
  { name: 'Harmony Music Studios', policyType: 'commercial', coverage: 750000, status: 'active', renewalDate: '2026-09-25', group: 'active' },
  { name: 'BrightPath Education Corp', policyType: 'commercial', coverage: 2500000, status: 'active', renewalDate: '2026-04-18', group: 'renewal' },
  { name: 'Atlas Manufacturing Co.', policyType: 'commercial', coverage: 7500000, status: 'active', renewalDate: '2027-06-12', group: 'active' },
  { name: 'Riverside Medical Center', policyType: 'commercial', coverage: 15000000, status: 'active', renewalDate: '2026-08-08', group: 'active' },
  { name: 'Summit Financial Advisors', policyType: 'commercial', coverage: 3000000, status: 'expired', renewalDate: '2026-01-31', group: 'expired' },
  { name: 'Oakwood Property Mgmt', policyType: 'commercial', coverage: 4000000, status: 'expired', renewalDate: '2025-12-20', group: 'expired' },
  { name: 'Sterling Auto Dealership', policyType: 'commercial', coverage: 5000000, status: 'cancelled', renewalDate: '2026-05-10', group: 'cancelled' },
  { name: 'Coastal Shipping Inc.', policyType: 'commercial', coverage: 8000000, status: 'active', renewalDate: '2027-02-22', group: 'active' },
  { name: 'Pioneer Aerospace Corp', policyType: 'commercial', coverage: 20000000, status: 'active', renewalDate: '2026-12-15', group: 'active' },
  { name: 'Evergreen Hotels Group', policyType: 'commercial', coverage: 12000000, status: 'active', renewalDate: '2027-04-05', group: 'active' },
];

function generatePolicyNumber(index: number, policyType: string): string {
  const prefix: Record<string, string> = { auto: 'AU', home: 'HM', life: 'LF', commercial: 'CM' };
  const pfx = prefix[policyType] || 'GN';
  return `POL-${pfx}-${String(100000 + index).slice(1)}`;
}

export async function seedPolicies(ctx: TrustGuardContext, boards: TrustGuardBoards): Promise<void> {
  console.log('[TrustGuard] Seeding 80 policy records...');

  const groupMap: Record<string, number> = {
    active: boards.policyActiveGroupId,
    renewal: boards.policyRenewalGroupId,
    expired: boards.policyExpiredGroupId,
    cancelled: boards.policyCancelledGroupId,
  };

  const agentPool = ctx.agentIds;

  for (let i = 0; i < POLICIES.length; i++) {
    const p = POLICIES[i];
    const policyNumber = generatePolicyNumber(i, p.policyType);
    const assignedAgent = agentPool[i % agentPool.length];

    const item = await Item.create({
      boardId: boards.policyLifecycleId,
      groupId: groupMap[p.group],
      name: `${policyNumber} — ${p.name}`,
      position: i,
      createdBy: assignedAgent,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.policyHolderColId, value: { userId: assignedAgent, displayName: p.name } },
      { itemId: item.id, columnId: boards.policyTypeColId, value: { selectedId: p.policyType } },
      { itemId: item.id, columnId: boards.coverageColId, value: { number: p.coverage } },
      { itemId: item.id, columnId: boards.policyStatusColId, value: { labelId: p.status } },
      { itemId: item.id, columnId: boards.renewalDateColId, value: { date: p.renewalDate } },
    ]);
  }

  console.log(`[TrustGuard] Seeded ${POLICIES.length} policies`);
}
