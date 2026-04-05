import { Item, ColumnValue } from '../../models';
import { NovaPayContext } from './workspace';
import { BoardContext } from './boards';

interface ComplianceCase {
  requirement: string;
  status: string;
  dueDate: string;
  caseType: string;
  priority: string;
  notes: string;
  merchantRef: string;
  group: string;
}

const COMPLIANCE_CASES: ComplianceCase[] = [
  // 8 KYC Reviews
  {
    requirement: 'Annual KYC refresh — GadgetVault Corp',
    status: 'In Progress',
    dueDate: '2026-04-15',
    caseType: 'kyc',
    priority: 'high',
    notes: 'Annual KYC renewal required per BSA/AML policy. Awaiting updated UBO documentation and most recent financial statements. Follow up scheduled with merchant COO.',
    merchantRef: 'GadgetVault',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC — New merchant verification: TechDirect Solutions',
    status: 'In Progress',
    dueDate: '2026-04-10',
    caseType: 'kyc',
    priority: 'high',
    notes: 'B2B electronics supplier with projected $1.25M monthly volume. Enhanced due diligence required for high-volume accounts. Business license verified, pending bank reference check.',
    merchantRef: 'TechDirect',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC remediation — SneakerDrop LLC',
    status: 'In Progress',
    dueDate: '2026-04-20',
    caseType: 'kyc',
    priority: 'critical',
    notes: 'Flagged during quarterly review. Resale marketplace operating in high-risk category. Need updated AML questionnaire, proof of authentication process, and supplier documentation.',
    merchantRef: 'SneakerDrop',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC document expiry — SwiftCab Transportation',
    status: 'Pending',
    dueDate: '2026-05-01',
    caseType: 'kyc',
    priority: 'medium',
    notes: 'Business license expires May 2026. Request renewal documentation 30 days prior. Current KYC rating: medium risk.',
    merchantRef: 'SwiftCab',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC update — EventSpark Productions',
    status: 'In Progress',
    dueDate: '2026-04-08',
    caseType: 'kyc',
    priority: 'high',
    notes: 'New merchant in KYC pipeline. Event ticketing classified as medium-risk. Collecting beneficial ownership information and 3 months bank statements.',
    merchantRef: 'EventSpark',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC annual review — TravelBee Vacations',
    status: 'Complete',
    dueDate: '2026-03-15',
    caseType: 'kyc',
    priority: 'medium',
    notes: 'Annual review completed. Travel agency remains medium-risk due to cancellation/chargeback exposure. All documentation on file and current. Next review: March 2027.',
    merchantRef: 'TravelBee',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC update — WineSelect Inc',
    status: 'Complete',
    dueDate: '2026-03-01',
    caseType: 'kyc',
    priority: 'low',
    notes: 'Age-restricted product verification completed. State liquor licenses verified across all shipping states. Shipping compliance process documented.',
    merchantRef: 'WineSelect',
    group: 'KYC Reviews',
  },
  {
    requirement: 'KYC review — CharityBridge Foundation',
    status: 'Overdue',
    dueDate: '2026-02-15',
    caseType: 'kyc',
    priority: 'critical',
    notes: 'Application rejected. Organization failed to provide verifiable 501(c)(3) status, board member identification, or source of funds documentation. Suspicious inbound transaction patterns flagged by automated screening. Case escalated to VP Compliance.',
    merchantRef: 'CharityBridge',
    group: 'KYC Reviews',
  },

  // 4 AML Investigations
  {
    requirement: 'AML — Suspicious activity report: unusual velocity spike',
    status: 'In Progress',
    dueDate: '2026-04-12',
    caseType: 'aml',
    priority: 'critical',
    notes: 'Merchant account detected with 400% transaction volume increase over 48-hour period. 87% of transactions from same BIN range. SAR filing under preparation. Merchant account temporarily rate-limited pending investigation.',
    merchantRef: 'StyleVerse',
    group: 'AML Investigations',
  },
  {
    requirement: 'AML — Quarterly transaction pattern analysis Q1 2026',
    status: 'In Progress',
    dueDate: '2026-04-30',
    caseType: 'aml',
    priority: 'high',
    notes: 'Routine quarterly AML screening across all active merchants. Automated rules flagged 3 accounts for manual review. Cross-referencing with OFAC/SDN lists completed, no matches.',
    merchantRef: 'All Merchants',
    group: 'AML Investigations',
  },
  {
    requirement: 'AML — Structuring pattern detected',
    status: 'Pending',
    dueDate: '2026-04-25',
    caseType: 'aml',
    priority: 'high',
    notes: 'Automated monitoring flagged potential structuring: multiple transactions just below $10,000 reporting threshold from single merchant. Under review — may be legitimate business pattern for catering orders.',
    merchantRef: 'Dragon Wok Express',
    group: 'AML Investigations',
  },
  {
    requirement: 'AML — Cross-border transaction review (LATAM corridor)',
    status: 'Complete',
    dueDate: '2026-03-20',
    caseType: 'aml',
    priority: 'medium',
    notes: 'Reviewed cross-border transaction patterns for LATAM-originating payments. All transactions within expected parameters. Enhanced monitoring remains active for Brazil and Colombia corridors per updated risk policy.',
    merchantRef: 'Multiple',
    group: 'AML Investigations',
  },

  // 3 Fraud Investigations
  {
    requirement: 'Fraud — Coordinated card testing attack',
    status: 'In Progress',
    dueDate: '2026-04-05',
    caseType: 'fraud',
    priority: 'critical',
    notes: 'Detected 2,300+ micro-transactions ($0.50-$1.00) across 15 merchant accounts within 2-hour window. Classic BIN attack / card testing pattern. Transactions blocked, compromised cards reported to issuers. Working with payment network fraud teams.',
    merchantRef: 'Multiple (15 accounts)',
    group: 'Fraud Cases',
  },
  {
    requirement: 'Fraud — Chargeback fraud ring investigation',
    status: 'In Progress',
    dueDate: '2026-04-18',
    caseType: 'fraud',
    priority: 'high',
    notes: 'Pattern of friendly fraud identified across 3 e-commerce merchants. Same consumer identities filing chargebacks after confirmed delivery. Compiling evidence packages for representment. Estimated exposure: $47,000.',
    merchantRef: 'ShopWave, LuxeCart, FitGear Pro',
    group: 'Fraud Cases',
  },
  {
    requirement: 'Fraud — Account takeover attempt on merchant portal',
    status: 'Complete',
    dueDate: '2026-03-10',
    caseType: 'fraud',
    priority: 'high',
    notes: 'Detected and blocked credential stuffing attack on merchant dashboard login. 450+ failed login attempts from rotating IP addresses. No successful breaches. Implemented mandatory 2FA for all merchant portal accounts. Security advisory issued.',
    merchantRef: 'Metro Mart',
    group: 'Fraud Cases',
  },
];

export async function seedCompliance(
  ctx: NovaPayContext,
  board: BoardContext
): Promise<void> {
  console.log(`[NovaPay] Seeding ${COMPLIANCE_CASES.length} compliance cases...`);

  const assignees = [ctx.complianceOfficerId, ctx.riskAnalystId, ctx.managerId];

  for (let i = 0; i < COMPLIANCE_CASES.length; i++) {
    const c = COMPLIANCE_CASES[i];
    const groupId = board.groups[c.group];
    const caseId = `CMP-${String(1001 + i).padStart(5, '0')}`;

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: `${caseId} — ${c.requirement}`,
      position: i,
      createdBy: ctx.complianceOfficerId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Requirement'], value: c.requirement },
      { itemId: item.id, columnId: board.columns['Status'], value: c.status },
      { itemId: item.id, columnId: board.columns['Due Date'], value: c.dueDate },
      { itemId: item.id, columnId: board.columns['Assigned To'], value: assignees[i % assignees.length] },
      { itemId: item.id, columnId: board.columns['Notes'], value: c.notes },
      { itemId: item.id, columnId: board.columns['Case Type'], value: c.caseType },
      { itemId: item.id, columnId: board.columns['Priority'], value: c.priority },
      { itemId: item.id, columnId: board.columns['Merchant Reference'], value: c.merchantRef },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[NovaPay] Seeded ${COMPLIANCE_CASES.length} compliance cases`);
}
