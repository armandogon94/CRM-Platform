import { Board, BoardGroup, BoardView, Column } from '../../models';
import { NovaPayContext } from './workspace';

export interface NovaPayBoards {
  transactionBoard: BoardContext;
  onboardingBoard: BoardContext;
  complianceBoard: BoardContext;
}

export interface BoardContext {
  boardId: number;
  groups: Record<string, number>;
  columns: Record<string, number>;
}

export async function seedNovaPayBoards(ctx: NovaPayContext): Promise<NovaPayBoards> {
  console.log('[NovaPay] Seeding boards, columns, and groups...');

  const transactionBoard = await createTransactionPipeline(ctx);
  const onboardingBoard = await createMerchantOnboarding(ctx);
  const complianceBoard = await createComplianceTracker(ctx);

  return { transactionBoard, onboardingBoard, complianceBoard };
}

async function createTransactionPipeline(ctx: NovaPayContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Transaction Pipeline',
    description: 'Real-time transaction monitoring, dispute tracking, and reconciliation',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'credit-card', color: '#2563EB' },
  });

  // Groups
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Pending Transactions', color: '#FCD34D', position: 0 },
    { name: 'Processing', color: '#60A5FA', position: 1 },
    { name: 'Settled', color: '#34D399', position: 2 },
    { name: 'Failed / Declined', color: '#F87171', position: 3 },
    { name: 'Disputed', color: '#FB923C', position: 4 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  // Columns
  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 0,
      width: 140,
      config: {
        options: [
          { label: 'Pending', color: '#FCD34D', order: 0 },
          { label: 'Processing', color: '#60A5FA', order: 1 },
          { label: 'Settled', color: '#34D399', order: 2 },
          { label: 'Failed', color: '#F87171', order: 3 },
          { label: 'Disputed', color: '#FB923C', order: 4 },
        ],
        default_option: 'Pending',
      },
    },
    {
      name: 'Amount',
      columnType: 'number' as const,
      position: 1,
      width: 120,
      config: { format: 'currency', decimal_places: 2, currency: 'USD' },
    },
    {
      name: 'Merchant',
      columnType: 'text' as const,
      position: 2,
      width: 180,
      config: {},
    },
    {
      name: 'Transaction Date',
      columnType: 'date' as const,
      position: 3,
      width: 140,
      config: { include_time: true },
    },
    {
      name: 'Settlement Status',
      columnType: 'dropdown' as const,
      position: 4,
      width: 160,
      config: {
        options: [
          { id: 'batch_pending', label: 'Batch Pending', color: '#FCD34D', order: 0 },
          { id: 'settled', label: 'Settled', color: '#34D399', order: 1 },
          { id: 'on_hold', label: 'On Hold', color: '#F87171', order: 2 },
        ],
      },
    },
    {
      name: 'Risk Score',
      columnType: 'number' as const,
      position: 5,
      width: 110,
      config: { format: 'plain', decimal_places: 0, min_value: 0, max_value: 100 },
    },
    {
      name: 'Card Type',
      columnType: 'dropdown' as const,
      position: 6,
      width: 120,
      config: {
        options: [
          { id: 'visa', label: 'Visa', color: '#1E40AF', order: 0 },
          { id: 'mastercard', label: 'Mastercard', color: '#EA580C', order: 1 },
          { id: 'amex', label: 'Amex', color: '#059669', order: 2 },
          { id: 'discover', label: 'Discover', color: '#D97706', order: 3 },
          { id: 'ach', label: 'ACH', color: '#7C3AED', order: 4 },
        ],
      },
    },
    {
      name: 'MCC',
      columnType: 'text' as const,
      position: 7,
      width: 100,
      config: {},
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  // Default table view
  await BoardView.create({
    boardId: board.id,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  // Kanban view
  await BoardView.create({
    boardId: board.id,
    name: 'Status Board',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[NovaPay] Transaction Pipeline board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

async function createMerchantOnboarding(ctx: NovaPayContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Merchant Onboarding',
    description: 'New merchant signup workflow, KYC verification, and contract management',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'building', color: '#1E40AF' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Submitted', color: '#94A3B8', position: 0 },
    { name: 'KYC In Progress', color: '#FCD34D', position: 1 },
    { name: 'KYC Verified', color: '#60A5FA', position: 2 },
    { name: 'Contract Signed', color: '#A78BFA', position: 3 },
    { name: 'API Active', color: '#34D399', position: 4 },
    { name: 'Rejected', color: '#F87171', position: 5 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Company Name',
      columnType: 'text' as const,
      position: 0,
      width: 200,
      config: {},
      isRequired: true,
    },
    {
      name: 'Application Status',
      columnType: 'status' as const,
      position: 1,
      width: 160,
      config: {
        options: [
          { label: 'Submitted', color: '#94A3B8', order: 0 },
          { label: 'KYC In Progress', color: '#FCD34D', order: 1 },
          { label: 'KYC Verified', color: '#60A5FA', order: 2 },
          { label: 'Contract Signed', color: '#A78BFA', order: 3 },
          { label: 'API Active', color: '#34D399', order: 4 },
          { label: 'Rejected', color: '#F87171', order: 5 },
        ],
        default_option: 'Submitted',
      },
    },
    {
      name: 'Risk Assessment',
      columnType: 'dropdown' as const,
      position: 2,
      width: 140,
      config: {
        options: [
          { id: 'low', label: 'Low', color: '#34D399', order: 0 },
          { id: 'medium', label: 'Medium', color: '#FCD34D', order: 1 },
          { id: 'high', label: 'High', color: '#F87171', order: 2 },
        ],
      },
    },
    {
      name: 'Compliance Notes',
      columnType: 'long_text' as const,
      position: 3,
      width: 250,
      config: {},
    },
    {
      name: 'Setup Date',
      columnType: 'date' as const,
      position: 4,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Monthly Volume',
      columnType: 'number' as const,
      position: 5,
      width: 150,
      config: { format: 'currency', decimal_places: 0, currency: 'USD' },
    },
    {
      name: 'Industry',
      columnType: 'dropdown' as const,
      position: 6,
      width: 140,
      config: {
        options: [
          { id: 'ecommerce', label: 'E-Commerce', color: '#2563EB', order: 0 },
          { id: 'retail', label: 'Retail', color: '#7C3AED', order: 1 },
          { id: 'saas', label: 'SaaS', color: '#059669', order: 2 },
          { id: 'food_service', label: 'Food Service', color: '#EA580C', order: 3 },
          { id: 'healthcare', label: 'Healthcare', color: '#06B6D4', order: 4 },
          { id: 'travel', label: 'Travel', color: '#D97706', order: 5 },
          { id: 'other', label: 'Other', color: '#94A3B8', order: 6 },
        ],
      },
    },
    {
      name: 'Contact Email',
      columnType: 'email' as const,
      position: 7,
      width: 180,
      config: {},
    },
    {
      name: 'Account Manager',
      columnType: 'person' as const,
      position: 8,
      width: 150,
      config: { allow_multiple: false },
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  await BoardView.create({
    boardId: board.id,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Onboarding Pipeline',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Application Status'] },
  });

  console.log(`[NovaPay] Merchant Onboarding board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

async function createComplianceTracker(ctx: NovaPayContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Compliance & Regulatory',
    description: 'Regulatory filings, audit status, violation alerts, and remediation tracking',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'shield-check', color: '#059669' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'KYC Reviews', color: '#2563EB', position: 0 },
    { name: 'AML Investigations', color: '#7C3AED', position: 1 },
    { name: 'Fraud Cases', color: '#F87171', position: 2 },
    { name: 'Regulatory Filings', color: '#D97706', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Requirement',
      columnType: 'text' as const,
      position: 0,
      width: 220,
      config: {},
      isRequired: true,
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 1,
      width: 140,
      config: {
        options: [
          { label: 'Pending', color: '#94A3B8', order: 0 },
          { label: 'In Progress', color: '#FCD34D', order: 1 },
          { label: 'Complete', color: '#34D399', order: 2 },
          { label: 'Overdue', color: '#F87171', order: 3 },
        ],
        default_option: 'Pending',
      },
    },
    {
      name: 'Due Date',
      columnType: 'date' as const,
      position: 2,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Assigned To',
      columnType: 'person' as const,
      position: 3,
      width: 150,
      config: { allow_multiple: false },
    },
    {
      name: 'Notes',
      columnType: 'long_text' as const,
      position: 4,
      width: 300,
      config: {},
    },
    {
      name: 'Case Type',
      columnType: 'dropdown' as const,
      position: 5,
      width: 140,
      config: {
        options: [
          { id: 'kyc', label: 'KYC', color: '#2563EB', order: 0 },
          { id: 'aml', label: 'AML', color: '#7C3AED', order: 1 },
          { id: 'fraud', label: 'Fraud', color: '#F87171', order: 2 },
          { id: 'pci', label: 'PCI-DSS', color: '#D97706', order: 3 },
          { id: 'regulatory', label: 'Regulatory', color: '#059669', order: 4 },
        ],
      },
    },
    {
      name: 'Priority',
      columnType: 'dropdown' as const,
      position: 6,
      width: 120,
      config: {
        options: [
          { id: 'critical', label: 'Critical', color: '#DC2626', order: 0 },
          { id: 'high', label: 'High', color: '#F87171', order: 1 },
          { id: 'medium', label: 'Medium', color: '#FCD34D', order: 2 },
          { id: 'low', label: 'Low', color: '#34D399', order: 3 },
        ],
      },
    },
    {
      name: 'Merchant Reference',
      columnType: 'text' as const,
      position: 7,
      width: 160,
      config: {},
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  await BoardView.create({
    boardId: board.id,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'case_type' },
  });

  console.log(`[NovaPay] Compliance & Regulatory board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}
