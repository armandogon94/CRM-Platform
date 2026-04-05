import { Item, ColumnValue } from '../../models';
import { TableSyncContext } from './workspace';
import { BoardContext } from './boards';

interface StaffRecord {
  staffName: string;
  role: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

const STAFF_SCHEDULES: StaffRecord[] = [
  // ─── Scheduled (15) ────────────────────────────────────────
  { staffName: 'Emma Hartwell', role: 'server', shiftDate: '2026-04-05', startTime: '2026-04-05T16:00:00', endTime: '2026-04-05T23:00:00', status: 'Scheduled' },
  { staffName: 'Jake Morrison', role: 'server', shiftDate: '2026-04-05', startTime: '2026-04-05T11:00:00', endTime: '2026-04-05T17:00:00', status: 'Scheduled' },
  { staffName: 'Priya Desai', role: 'host', shiftDate: '2026-04-05', startTime: '2026-04-05T16:00:00', endTime: '2026-04-05T23:00:00', status: 'Scheduled' },
  { staffName: 'Marcus Reed', role: 'chef', shiftDate: '2026-04-05', startTime: '2026-04-05T14:00:00', endTime: '2026-04-05T22:00:00', status: 'Scheduled' },
  { staffName: 'Lily Tran', role: 'busser', shiftDate: '2026-04-05', startTime: '2026-04-05T17:00:00', endTime: '2026-04-05T23:00:00', status: 'Scheduled' },
  { staffName: 'Carlos Mendez', role: 'server', shiftDate: '2026-04-06', startTime: '2026-04-06T16:00:00', endTime: '2026-04-06T23:00:00', status: 'Scheduled' },
  { staffName: 'Aisha Johnson', role: 'host', shiftDate: '2026-04-06', startTime: '2026-04-06T16:00:00', endTime: '2026-04-06T23:00:00', status: 'Scheduled' },
  { staffName: 'Ryan O\'Malley', role: 'chef', shiftDate: '2026-04-06', startTime: '2026-04-06T10:00:00', endTime: '2026-04-06T18:00:00', status: 'Scheduled' },
  { staffName: 'Nina Volkov', role: 'server', shiftDate: '2026-04-06', startTime: '2026-04-06T11:00:00', endTime: '2026-04-06T17:00:00', status: 'Scheduled' },
  { staffName: 'Dev Patel', role: 'busser', shiftDate: '2026-04-06', startTime: '2026-04-06T17:00:00', endTime: '2026-04-06T23:00:00', status: 'Scheduled' },
  { staffName: 'Mia Fontaine', role: 'manager', shiftDate: '2026-04-07', startTime: '2026-04-07T10:00:00', endTime: '2026-04-07T18:00:00', status: 'Scheduled' },
  { staffName: 'Tyler Brooks', role: 'server', shiftDate: '2026-04-07', startTime: '2026-04-07T16:00:00', endTime: '2026-04-07T23:00:00', status: 'Scheduled' },
  { staffName: 'Suki Yamamoto', role: 'chef', shiftDate: '2026-04-07', startTime: '2026-04-07T14:00:00', endTime: '2026-04-07T22:00:00', status: 'Scheduled' },
  { staffName: 'Jordan Blake', role: 'host', shiftDate: '2026-04-07', startTime: '2026-04-07T16:00:00', endTime: '2026-04-07T23:00:00', status: 'Scheduled' },
  { staffName: 'Chloe Stewart', role: 'busser', shiftDate: '2026-04-07', startTime: '2026-04-07T17:00:00', endTime: '2026-04-07T23:00:00', status: 'Scheduled' },

  // ─── Confirmed (15) ────────────────────────────────────────
  { staffName: 'Emma Hartwell', role: 'server', shiftDate: '2026-04-03', startTime: '2026-04-03T16:00:00', endTime: '2026-04-03T23:00:00', status: 'Confirmed' },
  { staffName: 'Carlos Mendez', role: 'server', shiftDate: '2026-04-03', startTime: '2026-04-03T11:00:00', endTime: '2026-04-03T17:00:00', status: 'Confirmed' },
  { staffName: 'Aisha Johnson', role: 'host', shiftDate: '2026-04-03', startTime: '2026-04-03T16:00:00', endTime: '2026-04-03T23:00:00', status: 'Confirmed' },
  { staffName: 'Marcus Reed', role: 'chef', shiftDate: '2026-04-03', startTime: '2026-04-03T14:00:00', endTime: '2026-04-03T22:00:00', status: 'Confirmed' },
  { staffName: 'Lily Tran', role: 'busser', shiftDate: '2026-04-03', startTime: '2026-04-03T17:00:00', endTime: '2026-04-03T23:00:00', status: 'Confirmed' },
  { staffName: 'Mia Fontaine', role: 'manager', shiftDate: '2026-04-03', startTime: '2026-04-03T10:00:00', endTime: '2026-04-03T18:00:00', status: 'Confirmed' },
  { staffName: 'Jake Morrison', role: 'server', shiftDate: '2026-04-04', startTime: '2026-04-04T16:00:00', endTime: '2026-04-04T23:00:00', status: 'Confirmed' },
  { staffName: 'Nina Volkov', role: 'server', shiftDate: '2026-04-04', startTime: '2026-04-04T11:00:00', endTime: '2026-04-04T17:00:00', status: 'Confirmed' },
  { staffName: 'Priya Desai', role: 'host', shiftDate: '2026-04-04', startTime: '2026-04-04T16:00:00', endTime: '2026-04-04T23:00:00', status: 'Confirmed' },
  { staffName: 'Ryan O\'Malley', role: 'chef', shiftDate: '2026-04-04', startTime: '2026-04-04T14:00:00', endTime: '2026-04-04T22:00:00', status: 'Confirmed' },
  { staffName: 'Dev Patel', role: 'busser', shiftDate: '2026-04-04', startTime: '2026-04-04T17:00:00', endTime: '2026-04-04T23:00:00', status: 'Confirmed' },
  { staffName: 'Suki Yamamoto', role: 'chef', shiftDate: '2026-04-04', startTime: '2026-04-04T10:00:00', endTime: '2026-04-04T18:00:00', status: 'Confirmed' },
  { staffName: 'Tyler Brooks', role: 'server', shiftDate: '2026-04-04', startTime: '2026-04-04T16:00:00', endTime: '2026-04-04T23:00:00', status: 'Confirmed' },
  { staffName: 'Jordan Blake', role: 'host', shiftDate: '2026-04-04', startTime: '2026-04-04T11:00:00', endTime: '2026-04-04T17:00:00', status: 'Confirmed' },
  { staffName: 'Chloe Stewart', role: 'busser', shiftDate: '2026-04-04', startTime: '2026-04-04T17:00:00', endTime: '2026-04-04T23:00:00', status: 'Confirmed' },

  // ─── Completed (15) ────────────────────────────────────────
  { staffName: 'Emma Hartwell', role: 'server', shiftDate: '2026-04-01', startTime: '2026-04-01T16:00:00', endTime: '2026-04-01T23:00:00', status: 'Completed' },
  { staffName: 'Jake Morrison', role: 'server', shiftDate: '2026-04-01', startTime: '2026-04-01T11:00:00', endTime: '2026-04-01T17:00:00', status: 'Completed' },
  { staffName: 'Priya Desai', role: 'host', shiftDate: '2026-04-01', startTime: '2026-04-01T16:00:00', endTime: '2026-04-01T23:00:00', status: 'Completed' },
  { staffName: 'Marcus Reed', role: 'chef', shiftDate: '2026-04-01', startTime: '2026-04-01T14:00:00', endTime: '2026-04-01T22:00:00', status: 'Completed' },
  { staffName: 'Lily Tran', role: 'busser', shiftDate: '2026-04-01', startTime: '2026-04-01T17:00:00', endTime: '2026-04-01T23:00:00', status: 'Completed' },
  { staffName: 'Carlos Mendez', role: 'server', shiftDate: '2026-04-02', startTime: '2026-04-02T16:00:00', endTime: '2026-04-02T23:00:00', status: 'Completed' },
  { staffName: 'Aisha Johnson', role: 'host', shiftDate: '2026-04-02', startTime: '2026-04-02T16:00:00', endTime: '2026-04-02T23:00:00', status: 'Completed' },
  { staffName: 'Ryan O\'Malley', role: 'chef', shiftDate: '2026-04-02', startTime: '2026-04-02T14:00:00', endTime: '2026-04-02T22:00:00', status: 'Completed' },
  { staffName: 'Nina Volkov', role: 'server', shiftDate: '2026-04-02', startTime: '2026-04-02T11:00:00', endTime: '2026-04-02T17:00:00', status: 'Completed' },
  { staffName: 'Dev Patel', role: 'busser', shiftDate: '2026-04-02', startTime: '2026-04-02T17:00:00', endTime: '2026-04-02T23:00:00', status: 'Completed' },
  { staffName: 'Mia Fontaine', role: 'manager', shiftDate: '2026-03-31', startTime: '2026-03-31T10:00:00', endTime: '2026-03-31T18:00:00', status: 'Completed' },
  { staffName: 'Suki Yamamoto', role: 'chef', shiftDate: '2026-03-31', startTime: '2026-03-31T14:00:00', endTime: '2026-03-31T22:00:00', status: 'Completed' },
  { staffName: 'Tyler Brooks', role: 'server', shiftDate: '2026-03-31', startTime: '2026-03-31T16:00:00', endTime: '2026-03-31T23:00:00', status: 'Completed' },
  { staffName: 'Jordan Blake', role: 'host', shiftDate: '2026-03-31', startTime: '2026-03-31T16:00:00', endTime: '2026-03-31T23:00:00', status: 'Completed' },
  { staffName: 'Chloe Stewart', role: 'busser', shiftDate: '2026-03-31', startTime: '2026-03-31T17:00:00', endTime: '2026-03-31T23:00:00', status: 'Completed' },

  // ─── Called Out (5) ────────────────────────────────────────
  { staffName: 'Jake Morrison', role: 'server', shiftDate: '2026-04-02', startTime: '2026-04-02T16:00:00', endTime: '2026-04-02T23:00:00', status: 'Called Out' },
  { staffName: 'Tyler Brooks', role: 'server', shiftDate: '2026-04-03', startTime: '2026-04-03T16:00:00', endTime: '2026-04-03T23:00:00', status: 'Called Out' },
  { staffName: 'Dev Patel', role: 'busser', shiftDate: '2026-04-05', startTime: '2026-04-05T17:00:00', endTime: '2026-04-05T23:00:00', status: 'Called Out' },
  { staffName: 'Priya Desai', role: 'host', shiftDate: '2026-04-06', startTime: '2026-04-06T16:00:00', endTime: '2026-04-06T23:00:00', status: 'Called Out' },
  { staffName: 'Nina Volkov', role: 'server', shiftDate: '2026-04-07', startTime: '2026-04-07T11:00:00', endTime: '2026-04-07T17:00:00', status: 'Called Out' },
];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Scheduled'];
}

export async function seedStaffSchedule(
  ctx: TableSyncContext,
  board: BoardContext
): Promise<void> {
  console.log(`[TableSync] Seeding ${STAFF_SCHEDULES.length} staff schedule records...`);

  const staffUsers = [
    ctx.serverLeadId, ctx.hostManagerId, ctx.headChefId,
    ctx.sousChefId, ctx.barManagerId, ctx.userId,
    ctx.gmId, ctx.eventCoordinatorId, ctx.adminId,
  ];

  for (let i = 0; i < STAFF_SCHEDULES.length; i++) {
    const s = STAFF_SCHEDULES[i];
    const groupId = getGroupForStatus(s.status, board.groups);

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: `${s.staffName} — ${s.shiftDate}`,
      position: i,
      createdBy: ctx.gmId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Staff Member'], value: staffUsers[i % staffUsers.length] },
      { itemId: item.id, columnId: board.columns['Role'], value: s.role },
      { itemId: item.id, columnId: board.columns['Shift Date'], value: s.shiftDate },
      { itemId: item.id, columnId: board.columns['Start Time'], value: s.startTime },
      { itemId: item.id, columnId: board.columns['End Time'], value: s.endTime },
      { itemId: item.id, columnId: board.columns['Status'], value: s.status },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[TableSync] Seeded ${STAFF_SCHEDULES.length} staff schedule records across ${Object.keys(board.groups).length} groups`);
}

export { STAFF_SCHEDULES };
