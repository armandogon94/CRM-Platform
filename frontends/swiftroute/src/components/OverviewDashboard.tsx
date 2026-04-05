import { Package, MapPin, Truck, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Board, Item, ColumnValue } from '../types';

interface OverviewDashboardProps {
  boards: Board[];
  allItems: Record<number, Item[]>;
}

function countByStatus(items: Item[], statusColumnId: number | undefined, label: string): number {
  if (!statusColumnId) return 0;
  return items.filter((item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === statusColumnId);
    const val = cv?.value as { label: string } | null;
    return val?.label === label;
  }).length;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Package;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function OverviewDashboard({ boards, allItems }: OverviewDashboardProps) {
  const shipmentBoard = boards.find((b) => b.name === 'Shipment Tracker');
  const routeBoard = boards.find((b) => b.name === 'Route Board');
  const fleetBoard = boards.find((b) => b.name === 'Fleet & Vehicle Tracking');

  const shipmentItems = shipmentBoard ? allItems[shipmentBoard.id] || [] : [];
  const routeItems = routeBoard ? allItems[routeBoard.id] || [] : [];
  const fleetItems = fleetBoard ? allItems[fleetBoard.id] || [] : [];

  const shipStatusCol = shipmentBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const routeStatusCol = routeBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const fleetStatusCol = fleetBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const inTransit = countByStatus(shipmentItems, shipStatusCol, 'in_transit');
  const delivered = countByStatus(shipmentItems, shipStatusCol, 'delivered');
  const exceptions = countByStatus(shipmentItems, shipStatusCol, 'exception');
  const activeRoutes = countByStatus(routeItems, routeStatusCol, 'in_progress');
  const availableVehicles = countByStatus(fleetItems, fleetStatusCol, 'available');
  const maintenanceVehicles = countByStatus(fleetItems, fleetStatusCol, 'maintenance');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">SwiftRoute Logistics — Delivering Excellence, Every Mile</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="In Transit" value={inTransit} color="#7C3AED" />
        <StatCard icon={CheckCircle2} label="Delivered" value={delivered} color="#00C875" />
        <StatCard icon={AlertTriangle} label="Exceptions" value={exceptions} color="#E2445C" />
        <StatCard icon={MapPin} label="Active Routes" value={activeRoutes} color="#6D28D9" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipment Tracker Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-brand-600" />
            <h3 className="font-semibold">Shipment Tracker</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Received', id: 'received', color: '#579BFC' },
              { label: 'Dispatched', id: 'dispatched', color: '#FDAB3D' },
              { label: 'In Transit', id: 'in_transit', color: '#A78BFA' },
              { label: 'Delivered', id: 'delivered', color: '#00C875' },
              { label: 'Exception', id: 'exception', color: '#E2445C' },
            ].map(({ label, id, color }) => {
              const count = countByStatus(shipmentItems, shipStatusCol, id);
              const total = shipmentItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route Board Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-brand-600" />
            <h3 className="font-semibold">Route Board</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Planned', id: 'planned', color: '#579BFC' },
              { label: 'In Progress', id: 'in_progress', color: '#A78BFA' },
              { label: 'Completed', id: 'completed', color: '#00C875' },
            ].map(({ label, id, color }) => {
              const count = countByStatus(routeItems, routeStatusCol, id);
              const total = routeItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fleet Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-brand-600" />
            <h3 className="font-semibold">Fleet & Vehicles</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Available', id: 'available', color: '#00C875' },
              { label: 'In Service', id: 'in_service', color: '#A78BFA' },
              { label: 'Maintenance', id: 'maintenance', color: '#FDAB3D' },
              { label: 'Retired', id: 'retired', color: '#C4C4C4' },
            ].map(({ label, id, color }) => {
              const count = countByStatus(fleetItems, fleetStatusCol, id);
              const total = fleetItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-semibold">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-600">{shipmentItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Shipments</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{routeItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Routes</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{fleetItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Fleet Vehicles</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{availableVehicles}</p>
            <p className="text-xs text-gray-500 mt-1">Available Vehicles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
