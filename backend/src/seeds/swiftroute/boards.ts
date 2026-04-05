import Board from '../../models/Board';
import BoardGroup from '../../models/BoardGroup';
import Column from '../../models/Column';
import { SwiftRouteContext } from './workspace';

export interface SwiftRouteBoards {
  // Board IDs
  shipmentTrackerId: number;
  routeBoardId: number;
  fleetTrackingId: number;

  // ─── Shipment Tracker columns ──────────────────────────────────────────
  trackingNumberColId: number;
  shipmentStatusColId: number;
  originColId: number;
  destinationColId: number;
  dispatchDateColId: number;
  deliveryDateColId: number;
  shipmentDriverColId: number;

  // ─── Route Board columns ──────────────────────────────────────────────
  routeNumberColId: number;
  routeStatusColId: number;
  shipmentsCountColId: number;
  routeDriverColId: number;
  routeDateColId: number;
  estimatedHoursColId: number;

  // ─── Fleet Tracking columns ───────────────────────────────────────────
  vehicleIdColId: number;
  vehicleStatusColId: number;
  lastServiceDateColId: number;
  milesColId: number;
  assignedDriverColId: number;

  // ─── Shipment groups ──────────────────────────────────────────────────
  shipReceivedGroupId: number;
  shipDispatchedGroupId: number;
  shipInTransitGroupId: number;
  shipDeliveredGroupId: number;
  shipExceptionGroupId: number;

  // ─── Route groups ─────────────────────────────────────────────────────
  routePlannedGroupId: number;
  routeInProgressGroupId: number;
  routeCompletedGroupId: number;

  // ─── Fleet groups ─────────────────────────────────────────────────────
  fleetAvailableGroupId: number;
  fleetInServiceGroupId: number;
  fleetMaintenanceGroupId: number;
  fleetRetiredGroupId: number;
}

export async function seedSwiftRouteBoards(ctx: SwiftRouteContext): Promise<SwiftRouteBoards> {
  console.log('[SwiftRoute] Creating board templates...');

  // ═══════════════════════════════════════════════════════════════════════════
  // Board 1: Shipment Tracker
  // ═══════════════════════════════════════════════════════════════════════════
  const shipmentBoard = await Board.create({
    name: 'Shipment Tracker',
    description: 'Track shipments from order receipt through last-mile delivery',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'package',
      color: '#7C3AED',
      category: 'logistics',
      defaultView: 'table',
    },
  });

  // Shipment groups
  const shipReceivedGroup = await BoardGroup.create({ boardId: shipmentBoard.id, name: 'Received', color: '#579BFC', position: 0 });
  const shipDispatchedGroup = await BoardGroup.create({ boardId: shipmentBoard.id, name: 'Dispatched', color: '#FDAB3D', position: 1 });
  const shipInTransitGroup = await BoardGroup.create({ boardId: shipmentBoard.id, name: 'In Transit', color: '#A78BFA', position: 2 });
  const shipDeliveredGroup = await BoardGroup.create({ boardId: shipmentBoard.id, name: 'Delivered', color: '#00C875', position: 3 });
  const shipExceptionGroup = await BoardGroup.create({ boardId: shipmentBoard.id, name: 'Exception', color: '#E2445C', position: 4 });

  // Shipment columns
  const trackingNumberCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Tracking Number', columnType: 'text', position: 0, width: 160,
    config: { placeholder: 'SR-XXXXXXXX' },
  });
  const shipmentStatusCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Status', columnType: 'status', position: 1, width: 140,
    config: {
      labels: [
        { id: 'received', text: 'Received', color: '#579BFC' },
        { id: 'dispatched', text: 'Dispatched', color: '#FDAB3D' },
        { id: 'in_transit', text: 'In Transit', color: '#A78BFA' },
        { id: 'delivered', text: 'Delivered', color: '#00C875' },
        { id: 'exception', text: 'Exception', color: '#E2445C' },
      ],
    },
  });
  const originCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Origin', columnType: 'text', position: 2, width: 140,
    config: { placeholder: 'City, ST' },
  });
  const destinationCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Destination', columnType: 'text', position: 3, width: 140,
    config: { placeholder: 'City, ST' },
  });
  const dispatchDateCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Dispatch Date', columnType: 'date', position: 4, width: 130,
  });
  const deliveryDateCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Delivery Date', columnType: 'date', position: 5, width: 130,
  });
  const shipmentDriverCol = await Column.create({
    boardId: shipmentBoard.id, name: 'Driver', columnType: 'person', position: 6, width: 160,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Board 2: Route Board
  // ═══════════════════════════════════════════════════════════════════════════
  const routeBoard = await Board.create({
    name: 'Route Board',
    description: 'Plan and track daily/weekly delivery routes',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'map-pin',
      color: '#6D28D9',
      category: 'logistics',
      defaultView: 'table',
    },
  });

  // Route groups
  const routePlannedGroup = await BoardGroup.create({ boardId: routeBoard.id, name: 'Planned', color: '#579BFC', position: 0 });
  const routeInProgressGroup = await BoardGroup.create({ boardId: routeBoard.id, name: 'In Progress', color: '#A78BFA', position: 1 });
  const routeCompletedGroup = await BoardGroup.create({ boardId: routeBoard.id, name: 'Completed', color: '#00C875', position: 2 });

  // Route columns
  const routeNumberCol = await Column.create({
    boardId: routeBoard.id, name: 'Route Number', columnType: 'text', position: 0, width: 140,
    config: { placeholder: 'RT-XXXX' },
  });
  const routeStatusCol = await Column.create({
    boardId: routeBoard.id, name: 'Status', columnType: 'status', position: 1, width: 130,
    config: {
      labels: [
        { id: 'planned', text: 'Planned', color: '#579BFC' },
        { id: 'in_progress', text: 'In Progress', color: '#A78BFA' },
        { id: 'completed', text: 'Completed', color: '#00C875' },
      ],
    },
  });
  const shipmentsCountCol = await Column.create({
    boardId: routeBoard.id, name: 'Shipments', columnType: 'number', position: 2, width: 110,
    config: { format: 'integer', unit: 'items' },
  });
  const routeDriverCol = await Column.create({
    boardId: routeBoard.id, name: 'Driver', columnType: 'person', position: 3, width: 160,
  });
  const routeDateCol = await Column.create({
    boardId: routeBoard.id, name: 'Date', columnType: 'date', position: 4, width: 130,
  });
  const estimatedHoursCol = await Column.create({
    boardId: routeBoard.id, name: 'Estimated Hours', columnType: 'number', position: 5, width: 130,
    config: { format: 'decimal', unit: 'hrs', decimals: 1 },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Board 3: Fleet & Vehicle Tracking
  // ═══════════════════════════════════════════════════════════════════════════
  const fleetBoard = await Board.create({
    name: 'Fleet & Vehicle Tracking',
    description: 'Monitor vehicle status, maintenance schedules, and fleet assignments',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'truck',
      color: '#5B21B6',
      category: 'logistics',
      defaultView: 'table',
    },
  });

  // Fleet groups
  const fleetAvailableGroup = await BoardGroup.create({ boardId: fleetBoard.id, name: 'Available', color: '#00C875', position: 0 });
  const fleetInServiceGroup = await BoardGroup.create({ boardId: fleetBoard.id, name: 'In Service', color: '#A78BFA', position: 1 });
  const fleetMaintenanceGroup = await BoardGroup.create({ boardId: fleetBoard.id, name: 'Maintenance', color: '#FDAB3D', position: 2 });
  const fleetRetiredGroup = await BoardGroup.create({ boardId: fleetBoard.id, name: 'Retired', color: '#C4C4C4', position: 3 });

  // Fleet columns
  const vehicleIdCol = await Column.create({
    boardId: fleetBoard.id, name: 'Vehicle ID', columnType: 'text', position: 0, width: 140,
    config: { placeholder: 'License plate' },
  });
  const vehicleStatusCol = await Column.create({
    boardId: fleetBoard.id, name: 'Status', columnType: 'status', position: 1, width: 140,
    config: {
      labels: [
        { id: 'available', text: 'Available', color: '#00C875' },
        { id: 'in_service', text: 'In Service', color: '#A78BFA' },
        { id: 'maintenance', text: 'Maintenance', color: '#FDAB3D' },
        { id: 'retired', text: 'Retired', color: '#C4C4C4' },
      ],
    },
  });
  const lastServiceDateCol = await Column.create({
    boardId: fleetBoard.id, name: 'Last Service Date', columnType: 'date', position: 2, width: 150,
  });
  const milesCol = await Column.create({
    boardId: fleetBoard.id, name: 'Miles', columnType: 'number', position: 3, width: 120,
    config: { format: 'integer', unit: 'mi' },
  });
  const assignedDriverCol = await Column.create({
    boardId: fleetBoard.id, name: 'Assigned Driver', columnType: 'person', position: 4, width: 160,
  });

  console.log('[SwiftRoute] Created 3 board templates with columns and groups');

  return {
    shipmentTrackerId: shipmentBoard.id,
    routeBoardId: routeBoard.id,
    fleetTrackingId: fleetBoard.id,
    // Shipment columns
    trackingNumberColId: trackingNumberCol.id,
    shipmentStatusColId: shipmentStatusCol.id,
    originColId: originCol.id,
    destinationColId: destinationCol.id,
    dispatchDateColId: dispatchDateCol.id,
    deliveryDateColId: deliveryDateCol.id,
    shipmentDriverColId: shipmentDriverCol.id,
    // Route columns
    routeNumberColId: routeNumberCol.id,
    routeStatusColId: routeStatusCol.id,
    shipmentsCountColId: shipmentsCountCol.id,
    routeDriverColId: routeDriverCol.id,
    routeDateColId: routeDateCol.id,
    estimatedHoursColId: estimatedHoursCol.id,
    // Fleet columns
    vehicleIdColId: vehicleIdCol.id,
    vehicleStatusColId: vehicleStatusCol.id,
    lastServiceDateColId: lastServiceDateCol.id,
    milesColId: milesCol.id,
    assignedDriverColId: assignedDriverCol.id,
    // Shipment groups
    shipReceivedGroupId: shipReceivedGroup.id,
    shipDispatchedGroupId: shipDispatchedGroup.id,
    shipInTransitGroupId: shipInTransitGroup.id,
    shipDeliveredGroupId: shipDeliveredGroup.id,
    shipExceptionGroupId: shipExceptionGroup.id,
    // Route groups
    routePlannedGroupId: routePlannedGroup.id,
    routeInProgressGroupId: routeInProgressGroup.id,
    routeCompletedGroupId: routeCompletedGroup.id,
    // Fleet groups
    fleetAvailableGroupId: fleetAvailableGroup.id,
    fleetInServiceGroupId: fleetInServiceGroup.id,
    fleetMaintenanceGroupId: fleetMaintenanceGroup.id,
    fleetRetiredGroupId: fleetRetiredGroup.id,
  };
}
