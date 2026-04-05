import Board from '../../models/Board';
import BoardGroup from '../../models/BoardGroup';
import Column from '../../models/Column';
import BoardView from '../../models/BoardView';
import { DentaFlowContext } from './workspace';

export interface DentaFlowBoards {
  patientPipelineId: number;
  appointmentBoardId: number;
  treatmentPlansId: number;
  // Column IDs — Patient Pipeline
  patientNameColId: number;
  patientStatusColId: number;
  insuranceColId: number;
  treatmentTypeColId: number;
  lastVisitColId: number;
  // Column IDs — Appointment Board
  apptPatientColId: number;
  apptDentistColId: number;
  apptDateTimeColId: number;
  apptChairColId: number;
  apptStatusColId: number;
  apptTreatmentColId: number;
  // Column IDs — Treatment Plans
  txPatientColId: number;
  txProcedureColId: number;
  txTotalVisitsColId: number;
  txVisitsCompletedColId: number;
  txStatusColId: number;
  txCostColId: number;
  // Group IDs — Patient Pipeline
  patientNewGroupId: number;
  patientIntakeGroupId: number;
  patientActiveGroupId: number;
  patientTreatmentGroupId: number;
  patientCompleteGroupId: number;
  // Group IDs — Appointment Board
  apptScheduledGroupId: number;
  apptConfirmedGroupId: number;
  apptCompletedGroupId: number;
  apptCancelledGroupId: number;
  // Group IDs — Treatment Plans
  txPlannedGroupId: number;
  txInProgressGroupId: number;
  txCompleteGroupId: number;
  txOnHoldGroupId: number;
}

export async function seedDentaFlowBoards(ctx: DentaFlowContext): Promise<DentaFlowBoards> {
  console.log('[DentaFlow] Creating board templates...');

  // ─── Board 1: Patient Pipeline ─────────────────────────────────────────────
  const patientBoard = await Board.create({
    name: 'Patient Pipeline',
    description: 'Track patients from intake through treatment completion',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'users',
      color: '#06B6D4',
      category: 'dental',
      defaultView: 'table',
    },
  });

  // Patient groups
  const patientNewGroup = await BoardGroup.create({ boardId: patientBoard.id, name: 'New Patients', color: '#579BFC', position: 0 });
  const patientIntakeGroup = await BoardGroup.create({ boardId: patientBoard.id, name: 'Intake Complete', color: '#FDAB3D', position: 1 });
  const patientActiveGroup = await BoardGroup.create({ boardId: patientBoard.id, name: 'Active', color: '#00C875', position: 2 });
  const patientTreatmentGroup = await BoardGroup.create({ boardId: patientBoard.id, name: 'In Treatment', color: '#9B59B6', position: 3 });
  const patientCompleteGroup = await BoardGroup.create({ boardId: patientBoard.id, name: 'Complete', color: '#C4C4C4', position: 4 });

  // Patient columns
  const patientNameCol = await Column.create({
    boardId: patientBoard.id, name: 'Patient Name', columnType: 'person', position: 0, width: 180,
  });
  const patientStatusCol = await Column.create({
    boardId: patientBoard.id, name: 'Status', columnType: 'status', position: 1, width: 140,
    config: {
      labels: [
        { id: 'new', text: 'New', color: '#579BFC' },
        { id: 'intake_complete', text: 'Intake Complete', color: '#FDAB3D' },
        { id: 'active', text: 'Active', color: '#00C875' },
        { id: 'treatment', text: 'Treatment', color: '#9B59B6' },
        { id: 'complete', text: 'Complete', color: '#C4C4C4' },
      ],
    },
  });
  const insuranceCol = await Column.create({
    boardId: patientBoard.id, name: 'Insurance', columnType: 'text', position: 2, width: 160,
    config: { placeholder: 'Insurance Provider' },
  });
  const treatmentTypeCol = await Column.create({
    boardId: patientBoard.id, name: 'Treatment Type', columnType: 'dropdown', position: 3, width: 150,
    config: {
      options: [
        { id: 'cleaning', text: 'Cleaning', color: '#00C875' },
        { id: 'filling', text: 'Filling', color: '#579BFC' },
        { id: 'crown', text: 'Crown', color: '#FDAB3D' },
        { id: 'root_canal', text: 'Root Canal', color: '#E2445C' },
        { id: 'orthodontics', text: 'Orthodontics', color: '#9B59B6' },
      ],
    },
  });
  const lastVisitCol = await Column.create({
    boardId: patientBoard.id, name: 'Last Visit', columnType: 'date', position: 4, width: 130,
  });

  await BoardView.create({
    boardId: patientBoard.id, name: 'Main Table', viewType: 'table',
    isDefault: true, createdBy: ctx.adminId, settings: {},
  });
  await BoardView.create({
    boardId: patientBoard.id, name: 'Kanban', viewType: 'kanban',
    isDefault: false, createdBy: ctx.adminId, settings: { groupByColumn: patientStatusCol.id },
  });

  // ─── Board 2: Appointment Board ────────────────────────────────────────────
  const appointmentBoard = await Board.create({
    name: 'Appointment Board',
    description: 'Chair scheduling and appointment management',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'calendar-clock',
      color: '#0891B2',
      category: 'dental',
      defaultView: 'table',
    },
  });

  // Appointment groups
  const apptScheduledGroup = await BoardGroup.create({ boardId: appointmentBoard.id, name: 'Scheduled', color: '#579BFC', position: 0 });
  const apptConfirmedGroup = await BoardGroup.create({ boardId: appointmentBoard.id, name: 'Confirmed', color: '#00C875', position: 1 });
  const apptCompletedGroup = await BoardGroup.create({ boardId: appointmentBoard.id, name: 'Completed', color: '#C4C4C4', position: 2 });
  const apptCancelledGroup = await BoardGroup.create({ boardId: appointmentBoard.id, name: 'Cancelled', color: '#E2445C', position: 3 });

  // Appointment columns
  const apptPatientCol = await Column.create({
    boardId: appointmentBoard.id, name: 'Patient Name', columnType: 'person', position: 0, width: 170,
  });
  const apptDentistCol = await Column.create({
    boardId: appointmentBoard.id, name: 'Dentist', columnType: 'person', position: 1, width: 170,
  });
  const apptDateTimeCol = await Column.create({
    boardId: appointmentBoard.id, name: 'Date/Time', columnType: 'date', position: 2, width: 170,
    config: { includeTime: true },
  });
  const apptChairCol = await Column.create({
    boardId: appointmentBoard.id, name: 'Chair', columnType: 'dropdown', position: 3, width: 100,
    config: {
      options: [
        { id: 'chair_1', text: '1', color: '#579BFC' },
        { id: 'chair_2', text: '2', color: '#00C875' },
        { id: 'chair_3', text: '3', color: '#FDAB3D' },
        { id: 'chair_4', text: '4', color: '#9B59B6' },
        { id: 'chair_5', text: '5', color: '#FF642E' },
      ],
    },
  });
  const apptStatusCol = await Column.create({
    boardId: appointmentBoard.id, name: 'Status', columnType: 'status', position: 4, width: 140,
    config: {
      labels: [
        { id: 'scheduled', text: 'Scheduled', color: '#579BFC' },
        { id: 'confirmed', text: 'Confirmed', color: '#00C875' },
        { id: 'completed', text: 'Completed', color: '#C4C4C4' },
        { id: 'cancelled', text: 'Cancelled', color: '#E2445C' },
      ],
    },
  });
  const apptTreatmentCol = await Column.create({
    boardId: appointmentBoard.id, name: 'Treatment', columnType: 'text', position: 5, width: 180,
    config: { placeholder: 'Planned treatment' },
  });

  await BoardView.create({
    boardId: appointmentBoard.id, name: 'Main Table', viewType: 'table',
    isDefault: true, createdBy: ctx.adminId, settings: {},
  });
  await BoardView.create({
    boardId: appointmentBoard.id, name: 'Calendar', viewType: 'calendar',
    isDefault: false, createdBy: ctx.adminId, settings: { dateColumn: apptDateTimeCol.id },
  });

  // ─── Board 3: Treatment Plans ──────────────────────────────────────────────
  const treatmentBoard = await Board.create({
    name: 'Treatment Plans',
    description: 'Track multi-visit dental procedures from planning through completion',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'clipboard-list',
      color: '#0E7490',
      category: 'dental',
      defaultView: 'table',
    },
  });

  // Treatment groups
  const txPlannedGroup = await BoardGroup.create({ boardId: treatmentBoard.id, name: 'Planned', color: '#579BFC', position: 0 });
  const txInProgressGroup = await BoardGroup.create({ boardId: treatmentBoard.id, name: 'In Progress', color: '#FDAB3D', position: 1 });
  const txCompleteGroup = await BoardGroup.create({ boardId: treatmentBoard.id, name: 'Complete', color: '#00C875', position: 2 });
  const txOnHoldGroup = await BoardGroup.create({ boardId: treatmentBoard.id, name: 'On Hold', color: '#C4C4C4', position: 3 });

  // Treatment columns
  const txPatientCol = await Column.create({
    boardId: treatmentBoard.id, name: 'Patient', columnType: 'person', position: 0, width: 170,
  });
  const txProcedureCol = await Column.create({
    boardId: treatmentBoard.id, name: 'Procedure', columnType: 'text', position: 1, width: 200,
    config: { placeholder: 'Treatment procedure description' },
  });
  const txTotalVisitsCol = await Column.create({
    boardId: treatmentBoard.id, name: 'Total Visits', columnType: 'number', position: 2, width: 120,
    config: { format: 'integer' },
  });
  const txVisitsCompletedCol = await Column.create({
    boardId: treatmentBoard.id, name: 'Visits Completed', columnType: 'number', position: 3, width: 140,
    config: { format: 'integer' },
  });
  const txStatusCol = await Column.create({
    boardId: treatmentBoard.id, name: 'Status', columnType: 'status', position: 4, width: 130,
    config: {
      labels: [
        { id: 'planned', text: 'Planned', color: '#579BFC' },
        { id: 'in_progress', text: 'In Progress', color: '#FDAB3D' },
        { id: 'complete', text: 'Complete', color: '#00C875' },
        { id: 'on_hold', text: 'On Hold', color: '#C4C4C4' },
      ],
    },
  });
  const txCostCol = await Column.create({
    boardId: treatmentBoard.id, name: 'Cost', columnType: 'number', position: 5, width: 120,
    config: { format: 'currency', currency: 'USD', decimals: 2 },
  });

  await BoardView.create({
    boardId: treatmentBoard.id, name: 'Main Table', viewType: 'table',
    isDefault: true, createdBy: ctx.adminId, settings: {},
  });
  await BoardView.create({
    boardId: treatmentBoard.id, name: 'Kanban', viewType: 'kanban',
    isDefault: false, createdBy: ctx.adminId, settings: { groupByColumn: txStatusCol.id },
  });

  console.log('[DentaFlow] Created 3 board templates with columns, groups, and views');

  return {
    patientPipelineId: patientBoard.id,
    appointmentBoardId: appointmentBoard.id,
    treatmentPlansId: treatmentBoard.id,
    // Patient columns
    patientNameColId: patientNameCol.id,
    patientStatusColId: patientStatusCol.id,
    insuranceColId: insuranceCol.id,
    treatmentTypeColId: treatmentTypeCol.id,
    lastVisitColId: lastVisitCol.id,
    // Appointment columns
    apptPatientColId: apptPatientCol.id,
    apptDentistColId: apptDentistCol.id,
    apptDateTimeColId: apptDateTimeCol.id,
    apptChairColId: apptChairCol.id,
    apptStatusColId: apptStatusCol.id,
    apptTreatmentColId: apptTreatmentCol.id,
    // Treatment columns
    txPatientColId: txPatientCol.id,
    txProcedureColId: txProcedureCol.id,
    txTotalVisitsColId: txTotalVisitsCol.id,
    txVisitsCompletedColId: txVisitsCompletedCol.id,
    txStatusColId: txStatusCol.id,
    txCostColId: txCostCol.id,
    // Patient groups
    patientNewGroupId: patientNewGroup.id,
    patientIntakeGroupId: patientIntakeGroup.id,
    patientActiveGroupId: patientActiveGroup.id,
    patientTreatmentGroupId: patientTreatmentGroup.id,
    patientCompleteGroupId: patientCompleteGroup.id,
    // Appointment groups
    apptScheduledGroupId: apptScheduledGroup.id,
    apptConfirmedGroupId: apptConfirmedGroup.id,
    apptCompletedGroupId: apptCompletedGroup.id,
    apptCancelledGroupId: apptCancelledGroup.id,
    // Treatment groups
    txPlannedGroupId: txPlannedGroup.id,
    txInProgressGroupId: txInProgressGroup.id,
    txCompleteGroupId: txCompleteGroup.id,
    txOnHoldGroupId: txOnHoldGroup.id,
  };
}
