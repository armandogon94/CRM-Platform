import Board from '../../models/Board';
import BoardGroup from '../../models/BoardGroup';
import BoardView from '../../models/BoardView';
import Column from '../../models/Column';
import { MedVistaContext } from './workspace';

export interface BoardContext {
  boardId: number;
  groups: Record<string, number>;
  columns: Record<string, number>;
}

export interface MedVistaBoards {
  patientBoard: BoardContext;
  appointmentBoard: BoardContext;
  claimsBoard: BoardContext;
}

export async function seedMedVistaBoards(ctx: MedVistaContext): Promise<MedVistaBoards> {
  console.log('[MedVista] Seeding boards, columns, and groups...');

  const patientBoard = await createPatientPipeline(ctx);
  const appointmentBoard = await createAppointmentScheduler(ctx);
  const claimsBoard = await createInsuranceClaims(ctx);

  return { patientBoard, appointmentBoard, claimsBoard };
}

// ─── Board 1: Patient Pipeline ──────────────────────────────────────────────

async function createPatientPipeline(ctx: MedVistaContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Patient Pipeline',
    description: 'Track new patients from intake through active treatment and discharge',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'users', color: '#059669' },
  });

  // Groups
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'New Patients', color: '#94A3B8', position: 0 },
    { name: 'Intake In Progress', color: '#FCD34D', position: 1 },
    { name: 'Active Patients', color: '#34D399', position: 2 },
    { name: 'Discharged', color: '#6B7280', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  // Columns
  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Patient Name',
      columnType: 'person' as const,
      position: 0,
      width: 180,
      config: { allow_multiple: false },
    },
    {
      name: 'Specialty',
      columnType: 'dropdown' as const,
      position: 1,
      width: 150,
      config: {
        options: [
          { id: 'primary_care', label: 'Primary Care', color: '#059669', order: 0 },
          { id: 'cardiology', label: 'Cardiology', color: '#DC2626', order: 1 },
          { id: 'orthopedics', label: 'Orthopedics', color: '#2563EB', order: 2 },
          { id: 'pediatrics', label: 'Pediatrics', color: '#9333EA', order: 3 },
        ],
      },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 2,
      width: 140,
      config: {
        options: [
          { label: 'New', color: '#94A3B8', order: 0 },
          { label: 'Intake', color: '#FCD34D', order: 1 },
          { label: 'Active', color: '#34D399', order: 2 },
          { label: 'Discharged', color: '#6B7280', order: 3 },
        ],
        default_option: 'New',
      },
    },
    {
      name: 'Insurance Verified',
      columnType: 'checkbox' as const,
      position: 3,
      width: 130,
      config: {},
    },
    {
      name: 'First Appointment',
      columnType: 'date' as const,
      position: 4,
      width: 140,
      config: { include_time: false },
    },
    {
      name: 'Phone',
      columnType: 'phone' as const,
      position: 5,
      width: 140,
      config: {},
    },
    {
      name: 'Email',
      columnType: 'email' as const,
      position: 6,
      width: 180,
      config: {},
    },
    {
      name: 'Date of Birth',
      columnType: 'date' as const,
      position: 7,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Insurance Provider',
      columnType: 'dropdown' as const,
      position: 8,
      width: 170,
      config: {
        options: [
          { id: 'aetna', label: 'Aetna', color: '#7C3AED', order: 0 },
          { id: 'blue_cross', label: 'Blue Cross', color: '#2563EB', order: 1 },
          { id: 'cigna', label: 'Cigna', color: '#059669', order: 2 },
          { id: 'united', label: 'UnitedHealthcare', color: '#D97706', order: 3 },
          { id: 'medicare', label: 'Medicare', color: '#DC2626', order: 4 },
          { id: 'medicaid', label: 'Medicaid', color: '#06B6D4', order: 5 },
        ],
      },
    },
    // Slice 21 follow-up — multi-assign Person column (closes verification follow-up #1)
    {
      name: 'Care Team',
      columnType: 'person' as const,
      position: 9,
      width: 180,
      config: { allow_multiple: true },
    },
    // Slice 21 follow-up — Files-type column (closes verification follow-up #4)
    {
      name: 'Attachments',
      columnType: 'files' as const,
      position: 10,
      width: 160,
      config: { max_files: 10 },
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  // Views
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
    name: 'Kanban by Status',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Calendar by First Appointment',
    viewType: 'calendar',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { dateColumn: columns['First Appointment'] },
  });

  console.log(`[MedVista] Patient Pipeline board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Board 2: Appointment Scheduler ─────────────────────────────────────────

async function createAppointmentScheduler(ctx: MedVistaContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Appointment Scheduler',
    description: 'Schedule and track patient appointments across all providers and specialties',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'calendar', color: '#2563EB' },
  });

  // Groups
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Scheduled', color: '#60A5FA', position: 0 },
    { name: 'Confirmed', color: '#A78BFA', position: 1 },
    { name: 'Completed', color: '#34D399', position: 2 },
    { name: 'No-Show', color: '#F87171', position: 3 },
    { name: 'Cancelled', color: '#6B7280', position: 4 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  // Columns
  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Patient Name',
      columnType: 'person' as const,
      position: 0,
      width: 180,
      config: { allow_multiple: false },
    },
    {
      name: 'Provider',
      columnType: 'person' as const,
      position: 1,
      width: 180,
      config: { allow_multiple: false },
    },
    {
      name: 'Date/Time',
      columnType: 'date' as const,
      position: 2,
      width: 160,
      config: { include_time: true },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 3,
      width: 140,
      config: {
        options: [
          { label: 'Scheduled', color: '#60A5FA', order: 0 },
          { label: 'Confirmed', color: '#A78BFA', order: 1 },
          { label: 'Completed', color: '#34D399', order: 2 },
          { label: 'No-Show', color: '#F87171', order: 3 },
          { label: 'Cancelled', color: '#6B7280', order: 4 },
        ],
        default_option: 'Scheduled',
      },
    },
    {
      name: 'Chief Complaint',
      columnType: 'long_text' as const,
      position: 4,
      width: 220,
      config: {},
    },
    {
      name: 'Specialty',
      columnType: 'dropdown' as const,
      position: 5,
      width: 150,
      config: {
        options: [
          { id: 'primary_care', label: 'Primary Care', color: '#059669', order: 0 },
          { id: 'cardiology', label: 'Cardiology', color: '#DC2626', order: 1 },
          { id: 'orthopedics', label: 'Orthopedics', color: '#2563EB', order: 2 },
          { id: 'pediatrics', label: 'Pediatrics', color: '#9333EA', order: 3 },
        ],
      },
    },
    {
      name: 'Room',
      columnType: 'dropdown' as const,
      position: 6,
      width: 120,
      config: {
        options: [
          { id: 'room_101', label: 'Room 101', color: '#60A5FA', order: 0 },
          { id: 'room_102', label: 'Room 102', color: '#34D399', order: 1 },
          { id: 'room_103', label: 'Room 103', color: '#FCD34D', order: 2 },
          { id: 'room_104', label: 'Room 104', color: '#F87171', order: 3 },
          { id: 'room_105', label: 'Room 105', color: '#A78BFA', order: 4 },
          { id: 'room_106', label: 'Room 106', color: '#FB923C', order: 5 },
          { id: 'room_107', label: 'Room 107', color: '#06B6D4', order: 6 },
          { id: 'room_108', label: 'Room 108', color: '#EC4899', order: 7 },
        ],
      },
    },
    {
      name: 'Duration',
      columnType: 'number' as const,
      position: 7,
      width: 110,
      config: { format: 'plain', suffix: 'min' },
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  // Views
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
    name: 'Calendar by Date/Time',
    viewType: 'calendar',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { dateColumn: columns['Date/Time'] },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Kanban by Status',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[MedVista] Appointment Scheduler board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Board 3: Insurance Claims ──────────────────────────────────────────────

async function createInsuranceClaims(ctx: MedVistaContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Insurance Claims',
    description: 'Track insurance claims from submission through payment or denial',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'file-text', color: '#D97706' },
  });

  // Groups
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Submitted', color: '#60A5FA', position: 0 },
    { name: 'Under Review', color: '#FCD34D', position: 1 },
    { name: 'Approved', color: '#34D399', position: 2 },
    { name: 'Denied', color: '#F87171', position: 3 },
    { name: 'Paid', color: '#059669', position: 4 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  // Columns
  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Claim Number',
      columnType: 'text' as const,
      position: 0,
      width: 140,
      config: {},
    },
    {
      name: 'Patient',
      columnType: 'person' as const,
      position: 1,
      width: 180,
      config: { allow_multiple: false },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 2,
      width: 140,
      config: {
        options: [
          { label: 'Submitted', color: '#60A5FA', order: 0 },
          { label: 'Under Review', color: '#FCD34D', order: 1 },
          { label: 'Approved', color: '#34D399', order: 2 },
          { label: 'Denied', color: '#F87171', order: 3 },
          { label: 'Paid', color: '#059669', order: 4 },
        ],
        default_option: 'Submitted',
      },
    },
    {
      name: 'Amount',
      columnType: 'number' as const,
      position: 3,
      width: 120,
      config: { format: 'currency', decimal_places: 2, currency: 'USD' },
    },
    {
      name: 'Submitted Date',
      columnType: 'date' as const,
      position: 4,
      width: 140,
      config: { include_time: false },
    },
    {
      name: 'Payment Date',
      columnType: 'date' as const,
      position: 5,
      width: 140,
      config: { include_time: false },
    },
    {
      name: 'Insurance Provider',
      columnType: 'dropdown' as const,
      position: 6,
      width: 170,
      config: {
        options: [
          { id: 'aetna', label: 'Aetna', color: '#7C3AED', order: 0 },
          { id: 'blue_cross', label: 'Blue Cross', color: '#2563EB', order: 1 },
          { id: 'cigna', label: 'Cigna', color: '#059669', order: 2 },
          { id: 'united', label: 'UnitedHealthcare', color: '#D97706', order: 3 },
          { id: 'medicare', label: 'Medicare', color: '#DC2626', order: 4 },
          { id: 'medicaid', label: 'Medicaid', color: '#06B6D4', order: 5 },
        ],
      },
    },
    {
      name: 'CPT Code',
      columnType: 'text' as const,
      position: 7,
      width: 120,
      config: {},
    },
    {
      name: 'Diagnosis',
      columnType: 'text' as const,
      position: 8,
      width: 200,
      config: {},
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  // Views
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
    name: 'Kanban by Status',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[MedVista] Insurance Claims board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}
