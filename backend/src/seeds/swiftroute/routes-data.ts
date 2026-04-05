import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { SwiftRouteContext } from './workspace';
import { SwiftRouteBoards } from './boards';

interface RouteRecord {
  routeNumber: string;
  status: string;
  shipments: number;
  driverIndex: number;
  date: string;
  estimatedHours: number;
  group: 'planned' | 'in_progress' | 'completed';
}

// ─── 50 Hard-coded Route Records ────────────────────────────────────────────
// Distribution: 23 Completed, 15 In Progress, 12 Planned

const ROUTES: RouteRecord[] = [
  // ═══ COMPLETED (23) — Jan–Mar 2026 ══════════════════════════════════════════
  { routeNumber: 'RT-1001', status: 'completed', shipments: 8,  driverIndex: 0,   date: '2026-01-05', estimatedHours: 7.5,  group: 'completed' },
  { routeNumber: 'RT-1002', status: 'completed', shipments: 12, driverIndex: 3,   date: '2026-01-07', estimatedHours: 10.0, group: 'completed' },
  { routeNumber: 'RT-1003', status: 'completed', shipments: 5,  driverIndex: 11,  date: '2026-01-12', estimatedHours: 4.5,  group: 'completed' },
  { routeNumber: 'RT-1004', status: 'completed', shipments: 10, driverIndex: 17,  date: '2026-01-15', estimatedHours: 8.0,  group: 'completed' },
  { routeNumber: 'RT-1005', status: 'completed', shipments: 3,  driverIndex: 22,  date: '2026-01-19', estimatedHours: 3.5,  group: 'completed' },
  { routeNumber: 'RT-1006', status: 'completed', shipments: 14, driverIndex: 30,  date: '2026-01-22', estimatedHours: 11.0, group: 'completed' },
  { routeNumber: 'RT-1007', status: 'completed', shipments: 7,  driverIndex: 8,   date: '2026-01-26', estimatedHours: 6.0,  group: 'completed' },
  { routeNumber: 'RT-1008', status: 'completed', shipments: 9,  driverIndex: 45,  date: '2026-01-30', estimatedHours: 7.0,  group: 'completed' },
  { routeNumber: 'RT-1009', status: 'completed', shipments: 6,  driverIndex: 52,  date: '2026-02-03', estimatedHours: 5.5,  group: 'completed' },
  { routeNumber: 'RT-1010', status: 'completed', shipments: 11, driverIndex: 14,  date: '2026-02-06', estimatedHours: 9.0,  group: 'completed' },
  { routeNumber: 'RT-1011', status: 'completed', shipments: 4,  driverIndex: 67,  date: '2026-02-10', estimatedHours: 3.5,  group: 'completed' },
  { routeNumber: 'RT-1012', status: 'completed', shipments: 15, driverIndex: 73,  date: '2026-02-14', estimatedHours: 12.0, group: 'completed' },
  { routeNumber: 'RT-1013', status: 'completed', shipments: 8,  driverIndex: 38,  date: '2026-02-18', estimatedHours: 6.5,  group: 'completed' },
  { routeNumber: 'RT-1014', status: 'completed', shipments: 13, driverIndex: 91,  date: '2026-02-21', estimatedHours: 10.5, group: 'completed' },
  { routeNumber: 'RT-1015', status: 'completed', shipments: 2,  driverIndex: 5,   date: '2026-02-25', estimatedHours: 3.0,  group: 'completed' },
  { routeNumber: 'RT-1016', status: 'completed', shipments: 9,  driverIndex: 100, date: '2026-03-02', estimatedHours: 7.5,  group: 'completed' },
  { routeNumber: 'RT-1017', status: 'completed', shipments: 7,  driverIndex: 56,  date: '2026-03-05', estimatedHours: 6.0,  group: 'completed' },
  { routeNumber: 'RT-1018', status: 'completed', shipments: 11, driverIndex: 84,  date: '2026-03-09', estimatedHours: 9.5,  group: 'completed' },
  { routeNumber: 'RT-1019', status: 'completed', shipments: 6,  driverIndex: 29,  date: '2026-03-13', estimatedHours: 5.0,  group: 'completed' },
  { routeNumber: 'RT-1020', status: 'completed', shipments: 10, driverIndex: 110, date: '2026-03-16', estimatedHours: 8.5,  group: 'completed' },
  { routeNumber: 'RT-1021', status: 'completed', shipments: 4,  driverIndex: 42,  date: '2026-03-19', estimatedHours: 4.0,  group: 'completed' },
  { routeNumber: 'RT-1022', status: 'completed', shipments: 13, driverIndex: 63,  date: '2026-03-22', estimatedHours: 11.5, group: 'completed' },
  { routeNumber: 'RT-1023', status: 'completed', shipments: 8,  driverIndex: 19,  date: '2026-03-25', estimatedHours: 7.0,  group: 'completed' },

  // ═══ IN PROGRESS (15) — late Mar – early Apr 2026 ═══════════════════════════
  { routeNumber: 'RT-1024', status: 'in_progress', shipments: 9,  driverIndex: 2,   date: '2026-03-28', estimatedHours: 7.5,  group: 'in_progress' },
  { routeNumber: 'RT-1025', status: 'in_progress', shipments: 6,  driverIndex: 15,  date: '2026-03-28', estimatedHours: 5.0,  group: 'in_progress' },
  { routeNumber: 'RT-1026', status: 'in_progress', shipments: 12, driverIndex: 37,  date: '2026-03-29', estimatedHours: 10.0, group: 'in_progress' },
  { routeNumber: 'RT-1027', status: 'in_progress', shipments: 4,  driverIndex: 48,  date: '2026-03-29', estimatedHours: 3.5,  group: 'in_progress' },
  { routeNumber: 'RT-1028', status: 'in_progress', shipments: 10, driverIndex: 71,  date: '2026-03-30', estimatedHours: 8.5,  group: 'in_progress' },
  { routeNumber: 'RT-1029', status: 'in_progress', shipments: 7,  driverIndex: 89,  date: '2026-03-30', estimatedHours: 6.0,  group: 'in_progress' },
  { routeNumber: 'RT-1030', status: 'in_progress', shipments: 14, driverIndex: 104, date: '2026-03-31', estimatedHours: 11.5, group: 'in_progress' },
  { routeNumber: 'RT-1031', status: 'in_progress', shipments: 5,  driverIndex: 26,  date: '2026-03-31', estimatedHours: 4.5,  group: 'in_progress' },
  { routeNumber: 'RT-1032', status: 'in_progress', shipments: 11, driverIndex: 58,  date: '2026-04-01', estimatedHours: 9.0,  group: 'in_progress' },
  { routeNumber: 'RT-1033', status: 'in_progress', shipments: 3,  driverIndex: 7,   date: '2026-04-01', estimatedHours: 3.0,  group: 'in_progress' },
  { routeNumber: 'RT-1034', status: 'in_progress', shipments: 8,  driverIndex: 95,  date: '2026-04-01', estimatedHours: 7.0,  group: 'in_progress' },
  { routeNumber: 'RT-1035', status: 'in_progress', shipments: 15, driverIndex: 33,  date: '2026-04-02', estimatedHours: 12.0, group: 'in_progress' },
  { routeNumber: 'RT-1036', status: 'in_progress', shipments: 6,  driverIndex: 76,  date: '2026-04-02', estimatedHours: 5.5,  group: 'in_progress' },
  { routeNumber: 'RT-1037', status: 'in_progress', shipments: 9,  driverIndex: 115, date: '2026-04-02', estimatedHours: 8.0,  group: 'in_progress' },
  { routeNumber: 'RT-1038', status: 'in_progress', shipments: 2,  driverIndex: 10,  date: '2026-04-02', estimatedHours: 3.0,  group: 'in_progress' },

  // ═══ PLANNED (12) — Apr 2–7, 2026 ══════════════════════════════════════════
  { routeNumber: 'RT-1039', status: 'planned', shipments: 10, driverIndex: 21,  date: '2026-04-02', estimatedHours: 8.5,  group: 'planned' },
  { routeNumber: 'RT-1040', status: 'planned', shipments: 7,  driverIndex: 54,  date: '2026-04-03', estimatedHours: 6.0,  group: 'planned' },
  { routeNumber: 'RT-1041', status: 'planned', shipments: 13, driverIndex: 82,  date: '2026-04-03', estimatedHours: 10.5, group: 'planned' },
  { routeNumber: 'RT-1042', status: 'planned', shipments: 5,  driverIndex: 40,  date: '2026-04-04', estimatedHours: 4.5,  group: 'planned' },
  { routeNumber: 'RT-1043', status: 'planned', shipments: 11, driverIndex: 99,  date: '2026-04-04', estimatedHours: 9.0,  group: 'planned' },
  { routeNumber: 'RT-1044', status: 'planned', shipments: 3,  driverIndex: 6,   date: '2026-04-05', estimatedHours: 3.5,  group: 'planned' },
  { routeNumber: 'RT-1045', status: 'planned', shipments: 14, driverIndex: 117, date: '2026-04-05', estimatedHours: 11.0, group: 'planned' },
  { routeNumber: 'RT-1046', status: 'planned', shipments: 8,  driverIndex: 35,  date: '2026-04-06', estimatedHours: 7.0,  group: 'planned' },
  { routeNumber: 'RT-1047', status: 'planned', shipments: 6,  driverIndex: 60,  date: '2026-04-06', estimatedHours: 5.5,  group: 'planned' },
  { routeNumber: 'RT-1048', status: 'planned', shipments: 12, driverIndex: 88,  date: '2026-04-07', estimatedHours: 10.0, group: 'planned' },
  { routeNumber: 'RT-1049', status: 'planned', shipments: 4,  driverIndex: 13,  date: '2026-04-07', estimatedHours: 4.0,  group: 'planned' },
  { routeNumber: 'RT-1050', status: 'planned', shipments: 9,  driverIndex: 46,  date: '2026-04-07', estimatedHours: 7.5,  group: 'planned' },
];

export async function seedRoutes(ctx: SwiftRouteContext, boards: SwiftRouteBoards): Promise<void> {
  console.log('[SwiftRoute] Seeding 50 route records...');

  const groupMap = {
    planned: boards.routePlannedGroupId,
    in_progress: boards.routeInProgressGroupId,
    completed: boards.routeCompletedGroupId,
  };

  for (let i = 0; i < ROUTES.length; i++) {
    const r = ROUTES[i];
    const item = await Item.create({
      boardId: boards.routeBoardId,
      groupId: groupMap[r.group],
      name: r.routeNumber,
      position: i,
      createdBy: ctx.adminId,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.routeNumberColId, value: { text: r.routeNumber } },
      { itemId: item.id, columnId: boards.routeStatusColId, value: { label: r.status } },
      { itemId: item.id, columnId: boards.shipmentsCountColId, value: { number: r.shipments } },
      { itemId: item.id, columnId: boards.routeDriverColId, value: { userId: ctx.driverIds[r.driverIndex] } },
      { itemId: item.id, columnId: boards.routeDateColId, value: { date: r.date } },
      { itemId: item.id, columnId: boards.estimatedHoursColId, value: { number: r.estimatedHours } },
    ]);
  }

  console.log('[SwiftRoute] Created 50 route records');
}
