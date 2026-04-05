import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { DentaFlowContext } from './workspace';
import { DentaFlowBoards } from './boards';

// ─── 80 Patient Records ─────────────────────────────────────────────────────
// Realistic mix across statuses and treatment types
// ~15 New, ~10 Intake Complete, ~30 Active, ~15 In Treatment, ~10 Complete

interface PatientRecord {
  name: string;
  insurance: string;
  treatmentType: string;  // cleaning | filling | crown | root_canal | orthodontics
  status: string;         // new | intake_complete | active | treatment | complete
  lastVisit: string;      // YYYY-MM-DD
  group: 'new' | 'intake' | 'active' | 'treatment' | 'complete';
}

const INSURANCE_PROVIDERS = [
  'Delta Dental', 'MetLife Dental', 'Cigna Dental', 'Aetna DMO',
  'Guardian Dental', 'Humana Dental', 'United Concordia', 'BlueCross Dental',
  'Principal Dental', 'Sun Life Dental', 'Ameritas Dental', 'Self-Pay',
];

const PATIENTS: PatientRecord[] = [
  // ─── New Patients (15) ────────────────────────────────────────
  { name: 'Olivia Thompson', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-04-01', group: 'new' },
  { name: 'Liam Nakamura', insurance: 'MetLife Dental', treatmentType: 'filling', status: 'new', lastVisit: '2026-03-30', group: 'new' },
  { name: 'Sophia Ramirez', insurance: 'Cigna Dental', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-04-02', group: 'new' },
  { name: 'Noah Adeyemi', insurance: 'Self-Pay', treatmentType: 'crown', status: 'new', lastVisit: '2026-03-28', group: 'new' },
  { name: 'Emma Johansson', insurance: 'Guardian Dental', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-03-31', group: 'new' },
  { name: 'James O\'Brien', insurance: 'Aetna DMO', treatmentType: 'root_canal', status: 'new', lastVisit: '2026-04-01', group: 'new' },
  { name: 'Isabella Park', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-03-29', group: 'new' },
  { name: 'Benjamin Kowalski', insurance: 'Humana Dental', treatmentType: 'filling', status: 'new', lastVisit: '2026-04-02', group: 'new' },
  { name: 'Mia Patel', insurance: 'BlueCross Dental', treatmentType: 'orthodontics', status: 'new', lastVisit: '2026-03-27', group: 'new' },
  { name: 'Alexander Dubois', insurance: 'United Concordia', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-03-30', group: 'new' },
  { name: 'Charlotte Kim', insurance: 'Principal Dental', treatmentType: 'filling', status: 'new', lastVisit: '2026-04-01', group: 'new' },
  { name: 'William Santos', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-03-28', group: 'new' },
  { name: 'Amelia Bergstrom', insurance: 'Sun Life Dental', treatmentType: 'crown', status: 'new', lastVisit: '2026-04-02', group: 'new' },
  { name: 'Ethan Okonkwo', insurance: 'Ameritas Dental', treatmentType: 'cleaning', status: 'new', lastVisit: '2026-03-31', group: 'new' },
  { name: 'Harper Torres', insurance: 'MetLife Dental', treatmentType: 'filling', status: 'new', lastVisit: '2026-03-29', group: 'new' },

  // ─── Intake Complete (10) ─────────────────────────────────────
  { name: 'Daniel Moreau', insurance: 'Delta Dental', treatmentType: 'filling', status: 'intake_complete', lastVisit: '2026-03-25', group: 'intake' },
  { name: 'Avery Tanaka', insurance: 'Cigna Dental', treatmentType: 'cleaning', status: 'intake_complete', lastVisit: '2026-03-22', group: 'intake' },
  { name: 'Scarlett Hassan', insurance: 'Aetna DMO', treatmentType: 'crown', status: 'intake_complete', lastVisit: '2026-03-24', group: 'intake' },
  { name: 'Henry Magnusson', insurance: 'Guardian Dental', treatmentType: 'root_canal', status: 'intake_complete', lastVisit: '2026-03-20', group: 'intake' },
  { name: 'Grace Washington', insurance: 'MetLife Dental', treatmentType: 'cleaning', status: 'intake_complete', lastVisit: '2026-03-26', group: 'intake' },
  { name: 'Sebastian Ivanov', insurance: 'BlueCross Dental', treatmentType: 'orthodontics', status: 'intake_complete', lastVisit: '2026-03-23', group: 'intake' },
  { name: 'Zoey Almeida', insurance: 'Humana Dental', treatmentType: 'filling', status: 'intake_complete', lastVisit: '2026-03-21', group: 'intake' },
  { name: 'Jack Obeng', insurance: 'Self-Pay', treatmentType: 'crown', status: 'intake_complete', lastVisit: '2026-03-19', group: 'intake' },
  { name: 'Lily Fernandez', insurance: 'United Concordia', treatmentType: 'cleaning', status: 'intake_complete', lastVisit: '2026-03-27', group: 'intake' },
  { name: 'Owen Christensen', insurance: 'Delta Dental', treatmentType: 'filling', status: 'intake_complete', lastVisit: '2026-03-18', group: 'intake' },

  // ─── Active Patients (30) ─────────────────────────────────────
  { name: 'Emily Sato', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-15', group: 'active' },
  { name: 'Lucas Mitchell', insurance: 'MetLife Dental', treatmentType: 'filling', status: 'active', lastVisit: '2026-02-28', group: 'active' },
  { name: 'Aria Nguyen', insurance: 'Cigna Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-10', group: 'active' },
  { name: 'Mason Rodriguez', insurance: 'Aetna DMO', treatmentType: 'crown', status: 'active', lastVisit: '2026-01-20', group: 'active' },
  { name: 'Chloe Anderson', insurance: 'Guardian Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-05', group: 'active' },
  { name: 'Logan Kim', insurance: 'Humana Dental', treatmentType: 'filling', status: 'active', lastVisit: '2026-02-14', group: 'active' },
  { name: 'Ella Petrov', insurance: 'BlueCross Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-12', group: 'active' },
  { name: 'Aiden Martinez', insurance: 'Principal Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-02-20', group: 'active' },
  { name: 'Luna Okafor', insurance: 'Sun Life Dental', treatmentType: 'filling', status: 'active', lastVisit: '2026-03-01', group: 'active' },
  { name: 'Jackson Chen', insurance: 'Delta Dental', treatmentType: 'crown', status: 'active', lastVisit: '2026-01-15', group: 'active' },
  { name: 'Penelope Brooks', insurance: 'MetLife Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-08', group: 'active' },
  { name: 'Carter Sullivan', insurance: 'Ameritas Dental', treatmentType: 'filling', status: 'active', lastVisit: '2026-02-10', group: 'active' },
  { name: 'Layla Johansson', insurance: 'Cigna Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-14', group: 'active' },
  { name: 'Jayden Park', insurance: 'United Concordia', treatmentType: 'orthodontics', status: 'active', lastVisit: '2026-02-25', group: 'active' },
  { name: 'Riley Hoffman', insurance: 'Guardian Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-03', group: 'active' },
  { name: 'Nolan Watanabe', insurance: 'Aetna DMO', treatmentType: 'filling', status: 'active', lastVisit: '2026-01-30', group: 'active' },
  { name: 'Hazel Lindqvist', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-11', group: 'active' },
  { name: 'Elijah Santos', insurance: 'Self-Pay', treatmentType: 'root_canal', status: 'active', lastVisit: '2026-02-18', group: 'active' },
  { name: 'Violet Adeyemi', insurance: 'Humana Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-07', group: 'active' },
  { name: 'Gabriel Novak', insurance: 'BlueCross Dental', treatmentType: 'filling', status: 'active', lastVisit: '2026-02-22', group: 'active' },
  { name: 'Stella Patel', insurance: 'MetLife Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-16', group: 'active' },
  { name: 'Leo Torres', insurance: 'Principal Dental', treatmentType: 'crown', status: 'active', lastVisit: '2026-01-25', group: 'active' },
  { name: 'Aurora Dubois', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-09', group: 'active' },
  { name: 'Mateo Osei', insurance: 'Sun Life Dental', treatmentType: 'filling', status: 'active', lastVisit: '2026-02-08', group: 'active' },
  { name: 'Isla Reeves', insurance: 'Cigna Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-13', group: 'active' },
  { name: 'Hudson Rao', insurance: 'Ameritas Dental', treatmentType: 'orthodontics', status: 'active', lastVisit: '2026-02-15', group: 'active' },
  { name: 'Willow Kowalski', insurance: 'Guardian Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-06', group: 'active' },
  { name: 'Ezra Hernandez', insurance: 'Aetna DMO', treatmentType: 'filling', status: 'active', lastVisit: '2026-02-12', group: 'active' },
  { name: 'Nova Chang', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'active', lastVisit: '2026-03-17', group: 'active' },
  { name: 'Miles Yamamoto', insurance: 'United Concordia', treatmentType: 'crown', status: 'active', lastVisit: '2026-01-18', group: 'active' },

  // ─── In Treatment (15) ────────────────────────────────────────
  { name: 'Zoe Abrams', insurance: 'Delta Dental', treatmentType: 'orthodontics', status: 'treatment', lastVisit: '2026-03-20', group: 'treatment' },
  { name: 'Caleb Engström', insurance: 'MetLife Dental', treatmentType: 'root_canal', status: 'treatment', lastVisit: '2026-03-18', group: 'treatment' },
  { name: 'Hannah Cohen', insurance: 'Cigna Dental', treatmentType: 'crown', status: 'treatment', lastVisit: '2026-03-22', group: 'treatment' },
  { name: 'Isaac Dominguez', insurance: 'BlueCross Dental', treatmentType: 'orthodontics', status: 'treatment', lastVisit: '2026-03-15', group: 'treatment' },
  { name: 'Nora Blake', insurance: 'Aetna DMO', treatmentType: 'crown', status: 'treatment', lastVisit: '2026-03-19', group: 'treatment' },
  { name: 'Thomas Achebe', insurance: 'Guardian Dental', treatmentType: 'root_canal', status: 'treatment', lastVisit: '2026-03-12', group: 'treatment' },
  { name: 'Audrey Laurent', insurance: 'Self-Pay', treatmentType: 'orthodontics', status: 'treatment', lastVisit: '2026-03-21', group: 'treatment' },
  { name: 'Samuel Björk', insurance: 'Humana Dental', treatmentType: 'filling', status: 'treatment', lastVisit: '2026-03-17', group: 'treatment' },
  { name: 'Victoria Mbeki', insurance: 'Delta Dental', treatmentType: 'crown', status: 'treatment', lastVisit: '2026-03-14', group: 'treatment' },
  { name: 'Nathan Krishnamurthy', insurance: 'Sun Life Dental', treatmentType: 'root_canal', status: 'treatment', lastVisit: '2026-03-16', group: 'treatment' },
  { name: 'Savannah Moreno', insurance: 'Principal Dental', treatmentType: 'orthodontics', status: 'treatment', lastVisit: '2026-03-23', group: 'treatment' },
  { name: 'Ryan Zhao', insurance: 'MetLife Dental', treatmentType: 'crown', status: 'treatment', lastVisit: '2026-03-11', group: 'treatment' },
  { name: 'Brooklyn Andersen', insurance: 'Ameritas Dental', treatmentType: 'filling', status: 'treatment', lastVisit: '2026-03-24', group: 'treatment' },
  { name: 'Adrian Nwosu', insurance: 'Cigna Dental', treatmentType: 'root_canal', status: 'treatment', lastVisit: '2026-03-13', group: 'treatment' },
  { name: 'Leah Fujimoto', insurance: 'BlueCross Dental', treatmentType: 'orthodontics', status: 'treatment', lastVisit: '2026-03-25', group: 'treatment' },

  // ─── Complete (10) ────────────────────────────────────────────
  { name: 'Dylan Svensson', insurance: 'Delta Dental', treatmentType: 'cleaning', status: 'complete', lastVisit: '2026-02-05', group: 'complete' },
  { name: 'Madeline Odom', insurance: 'MetLife Dental', treatmentType: 'filling', status: 'complete', lastVisit: '2026-01-10', group: 'complete' },
  { name: 'Cooper Al-Rashid', insurance: 'Cigna Dental', treatmentType: 'crown', status: 'complete', lastVisit: '2025-12-20', group: 'complete' },
  { name: 'Eleanor Hawthorne', insurance: 'Aetna DMO', treatmentType: 'root_canal', status: 'complete', lastVisit: '2026-01-28', group: 'complete' },
  { name: 'Levi Kozlov', insurance: 'Guardian Dental', treatmentType: 'cleaning', status: 'complete', lastVisit: '2025-11-15', group: 'complete' },
  { name: 'Paisley Morrison', insurance: 'Self-Pay', treatmentType: 'orthodontics', status: 'complete', lastVisit: '2026-02-10', group: 'complete' },
  { name: 'Lincoln Garcia', insurance: 'Humana Dental', treatmentType: 'filling', status: 'complete', lastVisit: '2025-12-05', group: 'complete' },
  { name: 'Addison Nakamura', insurance: 'BlueCross Dental', treatmentType: 'cleaning', status: 'complete', lastVisit: '2026-01-22', group: 'complete' },
  { name: 'Bentley Okafor', insurance: 'Delta Dental', treatmentType: 'crown', status: 'complete', lastVisit: '2025-12-18', group: 'complete' },
  { name: 'Naomi Petersen', insurance: 'United Concordia', treatmentType: 'cleaning', status: 'complete', lastVisit: '2026-02-01', group: 'complete' },
];

export async function seedPatients(ctx: DentaFlowContext, boards: DentaFlowBoards): Promise<void> {
  console.log('[DentaFlow] Seeding 80 patient records...');

  const groupMap: Record<string, number> = {
    new: boards.patientNewGroupId,
    intake: boards.patientIntakeGroupId,
    active: boards.patientActiveGroupId,
    treatment: boards.patientTreatmentGroupId,
    complete: boards.patientCompleteGroupId,
  };

  const dentistPool = ctx.dentistIds;

  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const assignedDentist = dentistPool[i % dentistPool.length];

    const item = await Item.create({
      boardId: boards.patientPipelineId,
      groupId: groupMap[p.group],
      name: p.name,
      position: i,
      createdBy: ctx.frontDeskId,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.patientNameColId, value: { userId: assignedDentist, displayName: p.name } },
      { itemId: item.id, columnId: boards.patientStatusColId, value: { labelId: p.status } },
      { itemId: item.id, columnId: boards.insuranceColId, value: { text: p.insurance } },
      { itemId: item.id, columnId: boards.treatmentTypeColId, value: { selectedId: p.treatmentType } },
      { itemId: item.id, columnId: boards.lastVisitColId, value: { date: p.lastVisit } },
    ]);
  }

  console.log(`[DentaFlow] Seeded ${PATIENTS.length} patients`);
}
