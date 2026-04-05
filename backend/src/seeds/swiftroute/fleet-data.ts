import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { SwiftRouteContext } from './workspace';
import { SwiftRouteBoards } from './boards';

interface VehicleRecord {
  vehicleId: string;
  status: string;
  lastServiceDate: string;
  miles: number;
  driverIndex: number;
  group: 'available' | 'in_service' | 'maintenance' | 'retired';
}

// ─── 30 Hard-coded Vehicle Records ──────────────────────────────────────────
// Distribution: 10 Available, 12 In Service, 5 Maintenance, 3 Retired

const VEHICLES: VehicleRecord[] = [
  // ═══ AVAILABLE (10) — recently serviced (last 3 months), moderate miles ═════
  { vehicleId: 'SR-4521',  status: 'available',   lastServiceDate: '2026-02-15', miles: 42300,  driverIndex: -1,  group: 'available' },
  { vehicleId: '7HBK-932', status: 'available',   lastServiceDate: '2026-03-02', miles: 31750,  driverIndex: 12,  group: 'available' },
  { vehicleId: '3MNP-641', status: 'available',   lastServiceDate: '2026-01-28', miles: 67400,  driverIndex: -1,  group: 'available' },
  { vehicleId: 'SR-7803',  status: 'available',   lastServiceDate: '2026-03-18', miles: 18200,  driverIndex: 44,  group: 'available' },
  { vehicleId: '9TXL-215', status: 'available',   lastServiceDate: '2026-02-22', miles: 55600,  driverIndex: -1,  group: 'available' },
  { vehicleId: '4DRV-889', status: 'available',   lastServiceDate: '2026-03-10', miles: 29100,  driverIndex: 78,  group: 'available' },
  { vehicleId: 'SR-1156',  status: 'available',   lastServiceDate: '2026-01-15', miles: 73800,  driverIndex: -1,  group: 'available' },
  { vehicleId: '6WKQ-340', status: 'available',   lastServiceDate: '2026-03-25', miles: 12400,  driverIndex: 51,  group: 'available' },
  { vehicleId: '2FNB-774', status: 'available',   lastServiceDate: '2026-02-08', miles: 48900,  driverIndex: -1,  group: 'available' },
  { vehicleId: 'SR-9234',  status: 'available',   lastServiceDate: '2026-03-30', miles: 8600,   driverIndex: 93,  group: 'available' },

  // ═══ IN SERVICE (12) — recently serviced, each assigned to a driver ═════════
  { vehicleId: '8JPC-107', status: 'in_service',  lastServiceDate: '2026-03-15', miles: 34500,  driverIndex: 2,   group: 'in_service' },
  { vehicleId: 'SR-3388',  status: 'in_service',  lastServiceDate: '2026-02-20', miles: 89200,  driverIndex: 15,  group: 'in_service' },
  { vehicleId: '5AYM-562', status: 'in_service',  lastServiceDate: '2026-03-08', miles: 56700,  driverIndex: 37,  group: 'in_service' },
  { vehicleId: '1KLR-419', status: 'in_service',  lastServiceDate: '2026-01-30', miles: 112300, driverIndex: 48,  group: 'in_service' },
  { vehicleId: 'SR-6671',  status: 'in_service',  lastServiceDate: '2026-03-22', miles: 21800,  driverIndex: 71,  group: 'in_service' },
  { vehicleId: '7BSN-853', status: 'in_service',  lastServiceDate: '2026-02-12', miles: 97400,  driverIndex: 89,  group: 'in_service' },
  { vehicleId: '3GHT-296', status: 'in_service',  lastServiceDate: '2026-03-01', miles: 45600,  driverIndex: 104, group: 'in_service' },
  { vehicleId: 'SR-2045',  status: 'in_service',  lastServiceDate: '2026-03-28', miles: 15900,  driverIndex: 26,  group: 'in_service' },
  { vehicleId: '6DXC-738', status: 'in_service',  lastServiceDate: '2026-02-25', miles: 78100,  driverIndex: 58,  group: 'in_service' },
  { vehicleId: '4PRW-181', status: 'in_service',  lastServiceDate: '2026-03-12', miles: 63200,  driverIndex: 7,   group: 'in_service' },
  { vehicleId: 'SR-5517',  status: 'in_service',  lastServiceDate: '2026-01-22', miles: 105800, driverIndex: 95,  group: 'in_service' },
  { vehicleId: '9MVJ-604', status: 'in_service',  lastServiceDate: '2026-03-19', miles: 27300,  driverIndex: 33,  group: 'in_service' },

  // ═══ MAINTENANCE (5) — overdue service or high miles ════════════════════════
  { vehicleId: '2QAL-950', status: 'maintenance', lastServiceDate: '2025-08-14', miles: 156200, driverIndex: 20,  group: 'maintenance' },
  { vehicleId: 'SR-8102',  status: 'maintenance', lastServiceDate: '2025-09-30', miles: 143800, driverIndex: 66,  group: 'maintenance' },
  { vehicleId: '5TVH-327', status: 'maintenance', lastServiceDate: '2025-07-05', miles: 178500, driverIndex: -1,  group: 'maintenance' },
  { vehicleId: '8FRK-483', status: 'maintenance', lastServiceDate: '2025-10-18', miles: 131600, driverIndex: 102, group: 'maintenance' },
  { vehicleId: 'SR-4479',  status: 'maintenance', lastServiceDate: '2025-06-22', miles: 192000, driverIndex: -1,  group: 'maintenance' },

  // ═══ RETIRED (3) — old service dates, high miles, no driver ═════════════════
  { vehicleId: '1NCS-712', status: 'retired',     lastServiceDate: '2024-11-10', miles: 245000, driverIndex: -1,  group: 'retired' },
  { vehicleId: 'SR-0287',  status: 'retired',     lastServiceDate: '2024-08-03', miles: 218700, driverIndex: -1,  group: 'retired' },
  { vehicleId: '7ZWP-156', status: 'retired',     lastServiceDate: '2025-01-15', miles: 203400, driverIndex: -1,  group: 'retired' },
];

export async function seedFleet(ctx: SwiftRouteContext, boards: SwiftRouteBoards): Promise<void> {
  console.log('[SwiftRoute] Seeding 30 vehicle records...');

  const groupMap = {
    available: boards.fleetAvailableGroupId,
    in_service: boards.fleetInServiceGroupId,
    maintenance: boards.fleetMaintenanceGroupId,
    retired: boards.fleetRetiredGroupId,
  };

  for (let i = 0; i < VEHICLES.length; i++) {
    const v = VEHICLES[i];
    const item = await Item.create({
      boardId: boards.fleetTrackingId,
      groupId: groupMap[v.group],
      name: v.vehicleId,
      position: i,
      createdBy: ctx.adminId,
    });

    const columnValues: { itemId: number; columnId: number; value: any }[] = [
      { itemId: item.id, columnId: boards.vehicleIdColId, value: { text: v.vehicleId } },
      { itemId: item.id, columnId: boards.vehicleStatusColId, value: { label: v.status } },
      { itemId: item.id, columnId: boards.lastServiceDateColId, value: { date: v.lastServiceDate } },
      { itemId: item.id, columnId: boards.milesColId, value: { number: v.miles } },
    ];

    if (v.driverIndex !== -1) {
      columnValues.push({
        itemId: item.id,
        columnId: boards.assignedDriverColId,
        value: { userId: ctx.driverIds[v.driverIndex] },
      });
    }

    await ColumnValue.bulkCreate(columnValues);
  }

  console.log('[SwiftRoute] Created 30 vehicle records');
}
