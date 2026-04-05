import { Item, ColumnValue } from '../../models';
import { NovaPayContext } from './workspace';
import { BoardContext } from './boards';
import { ALL_MERCHANTS } from './merchants';

const CARD_TYPES = ['visa', 'mastercard', 'amex', 'discover', 'ach'];
const CARD_WEIGHTS = [0.40, 0.30, 0.12, 0.08, 0.10]; // distribution

const MCC_CODES: Record<string, string[]> = {
  ecommerce: ['5411', '5942', '5944', '5945', '5947'],
  retail: ['5311', '5411', '5541', '5912', '5999'],
  saas: ['5734', '5817', '5818', '7372', '7379'],
  food_service: ['5812', '5813', '5814', '5499'],
  healthcare: ['8011', '8021', '8042', '8099'],
  travel: ['4511', '4722', '7011', '7512'],
  other: ['7299', '7999', '8999', '9399'],
};

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(startDays: number, endDays: number): string {
  const now = new Date('2026-04-02');
  const start = new Date(now.getTime() - startDays * 86400000);
  const end = new Date(now.getTime() - endDays * 86400000);
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

function randomRiskScore(status: string, merchantRisk: string): number {
  if (status === 'Disputed') return Math.floor(Math.random() * 30) + 70; // 70-100
  if (status === 'Failed') return Math.floor(Math.random() * 40) + 40; // 40-80
  if (merchantRisk === 'high') return Math.floor(Math.random() * 40) + 40; // 40-80
  if (merchantRisk === 'medium') return Math.floor(Math.random() * 30) + 20; // 20-50
  return Math.floor(Math.random() * 25) + 5; // 5-30 (low risk)
}

interface TransactionDef {
  merchantName: string;
  merchantIndustry: string;
  merchantRisk: string;
  status: string;
  amount: number;
  date: string;
  riskScore: number;
  cardType: string;
  mcc: string;
  settlementStatus: string;
}

function generateTransactions(): TransactionDef[] {
  const txns: TransactionDef[] = [];
  const activeMerchants = ALL_MERCHANTS.filter(m => m.status === 'API Active');

  // 180 successful (settled or batch pending)
  for (let i = 0; i < 180; i++) {
    const merchant = activeMerchants[i % activeMerchants.length];
    const isSettled = Math.random() < 0.7;
    const amount = merchant.monthlyVolume > 500000
      ? randomAmount(100, 50000)
      : merchant.monthlyVolume > 200000
        ? randomAmount(25, 15000)
        : randomAmount(10, 5000);

    const mccList = MCC_CODES[merchant.industry] || MCC_CODES['other'];

    txns.push({
      merchantName: merchant.name,
      merchantIndustry: merchant.industry,
      merchantRisk: merchant.risk,
      status: isSettled ? 'Settled' : 'Processing',
      amount,
      date: randomDate(90, 0),
      riskScore: randomRiskScore('Settled', merchant.risk),
      cardType: weightedRandom(CARD_TYPES, CARD_WEIGHTS),
      mcc: mccList[Math.floor(Math.random() * mccList.length)],
      settlementStatus: isSettled ? 'settled' : 'batch_pending',
    });
  }

  // 12 declined/failed
  for (let i = 0; i < 12; i++) {
    const merchant = activeMerchants[Math.floor(Math.random() * activeMerchants.length)];
    const mccList = MCC_CODES[merchant.industry] || MCC_CODES['other'];

    txns.push({
      merchantName: merchant.name,
      merchantIndustry: merchant.industry,
      merchantRisk: merchant.risk,
      status: 'Failed',
      amount: randomAmount(50, 25000),
      date: randomDate(60, 0),
      riskScore: randomRiskScore('Failed', merchant.risk),
      cardType: weightedRandom(CARD_TYPES, CARD_WEIGHTS),
      mcc: mccList[Math.floor(Math.random() * mccList.length)],
      settlementStatus: 'on_hold',
    });
  }

  // 8 disputed
  for (let i = 0; i < 8; i++) {
    const merchant = activeMerchants[Math.floor(Math.random() * activeMerchants.length)];
    const mccList = MCC_CODES[merchant.industry] || MCC_CODES['other'];

    txns.push({
      merchantName: merchant.name,
      merchantIndustry: merchant.industry,
      merchantRisk: merchant.risk,
      status: 'Disputed',
      amount: randomAmount(100, 15000),
      date: randomDate(45, 0),
      riskScore: randomRiskScore('Disputed', merchant.risk),
      cardType: weightedRandom(CARD_TYPES, CARD_WEIGHTS),
      mcc: mccList[Math.floor(Math.random() * mccList.length)],
      settlementStatus: 'on_hold',
    });
  }

  return txns;
}

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  const mapping: Record<string, string> = {
    'Pending': 'Pending Transactions',
    'Processing': 'Processing',
    'Settled': 'Settled',
    'Failed': 'Failed / Declined',
    'Disputed': 'Disputed',
  };
  return groups[mapping[status] || 'Pending Transactions'];
}

export async function seedTransactions(
  ctx: NovaPayContext,
  board: BoardContext
): Promise<void> {
  const txns = generateTransactions();
  console.log(`[NovaPay] Seeding ${txns.length} transactions...`);

  for (let i = 0; i < txns.length; i++) {
    const t = txns[i];
    const groupId = getGroupForStatus(t.status, board.groups);
    const txnId = `TXN-${String(10000 + i).padStart(6, '0')}`;

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: `${txnId} — ${t.merchantName}`,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Status'], value: t.status },
      { itemId: item.id, columnId: board.columns['Amount'], value: t.amount },
      { itemId: item.id, columnId: board.columns['Merchant'], value: t.merchantName },
      { itemId: item.id, columnId: board.columns['Transaction Date'], value: t.date },
      { itemId: item.id, columnId: board.columns['Settlement Status'], value: t.settlementStatus },
      { itemId: item.id, columnId: board.columns['Risk Score'], value: t.riskScore },
      { itemId: item.id, columnId: board.columns['Card Type'], value: t.cardType },
      { itemId: item.id, columnId: board.columns['MCC'], value: t.mcc },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[NovaPay] Seeded ${txns.length} transactions`);
}
