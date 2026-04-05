import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { DentaFlowContext } from './workspace';
import { DentaFlowBoards } from './boards';

// ─── 30 Treatment Plan Records ──────────────────────────────────────────────
// Multi-visit procedures: orthodontics (12-24 visits), root canals (2-3),
// crowns (2-3), implants (3-5), veneers (2-3), bridges (3-4)

interface TreatmentRecord {
  patientName: string;
  procedure: string;
  totalVisits: number;
  visitsCompleted: number;
  status: string;         // planned | in_progress | complete | on_hold
  cost: number;
  group: 'planned' | 'in_progress' | 'complete' | 'on_hold';
}

const TREATMENTS: TreatmentRecord[] = [
  // ─── Planned (8) ──────────────────────────────────────────────
  { patientName: 'Mia Patel', procedure: 'Full orthodontic treatment — upper & lower braces', totalVisits: 24, visitsCompleted: 0, status: 'planned', cost: 5500, group: 'planned' },
  { patientName: 'Scarlett Hassan', procedure: 'Porcelain crown #2 — prep, temp, delivery', totalVisits: 3, visitsCompleted: 0, status: 'planned', cost: 1200, group: 'planned' },
  { patientName: 'Henry Magnusson', procedure: 'Root canal therapy #14 with post & core', totalVisits: 3, visitsCompleted: 0, status: 'planned', cost: 1800, group: 'planned' },
  { patientName: 'Alexander Dubois', procedure: 'Dental implant #19 — surgery, abutment, crown', totalVisits: 5, visitsCompleted: 0, status: 'planned', cost: 4200, group: 'planned' },
  { patientName: 'Charlotte Kim', procedure: 'Composite veneers #6-#11 (6 units)', totalVisits: 3, visitsCompleted: 0, status: 'planned', cost: 3600, group: 'planned' },
  { patientName: 'Amelia Bergstrom', procedure: 'Fixed bridge #3-#5 (3-unit PFM)', totalVisits: 4, visitsCompleted: 0, status: 'planned', cost: 3200, group: 'planned' },
  { patientName: 'Ethan Okonkwo', procedure: 'Full-mouth debridement + SRP 4 quadrants', totalVisits: 5, visitsCompleted: 0, status: 'planned', cost: 1600, group: 'planned' },
  { patientName: 'Harper Torres', procedure: 'Invisalign clear aligner treatment', totalVisits: 18, visitsCompleted: 0, status: 'planned', cost: 4800, group: 'planned' },

  // ─── In Progress (12) ─────────────────────────────────────────
  { patientName: 'Zoe Abrams', procedure: 'Full orthodontic treatment — ceramic braces', totalVisits: 20, visitsCompleted: 8, status: 'in_progress', cost: 5200, group: 'in_progress' },
  { patientName: 'Caleb Engström', procedure: 'Root canal therapy #19 — multi-visit', totalVisits: 3, visitsCompleted: 2, status: 'in_progress', cost: 1500, group: 'in_progress' },
  { patientName: 'Hannah Cohen', procedure: 'Zirconia crown #14 — prep & delivery', totalVisits: 3, visitsCompleted: 1, status: 'in_progress', cost: 1400, group: 'in_progress' },
  { patientName: 'Isaac Dominguez', procedure: 'Orthodontic treatment — phase 2 lower arch', totalVisits: 16, visitsCompleted: 10, status: 'in_progress', cost: 3800, group: 'in_progress' },
  { patientName: 'Nora Blake', procedure: 'E-max crown #30 — prep, temp, cementation', totalVisits: 3, visitsCompleted: 2, status: 'in_progress', cost: 1350, group: 'in_progress' },
  { patientName: 'Thomas Achebe', procedure: 'Root canal therapy #3 with fiber post', totalVisits: 2, visitsCompleted: 1, status: 'in_progress', cost: 1600, group: 'in_progress' },
  { patientName: 'Audrey Laurent', procedure: 'Invisalign refinement trays — 12 aligners', totalVisits: 12, visitsCompleted: 5, status: 'in_progress', cost: 2400, group: 'in_progress' },
  { patientName: 'Victoria Mbeki', procedure: 'PFM crown #19 — following RCT', totalVisits: 3, visitsCompleted: 1, status: 'in_progress', cost: 1100, group: 'in_progress' },
  { patientName: 'Nathan Krishnamurthy', procedure: 'Root canal retreat #30 — referral case', totalVisits: 3, visitsCompleted: 2, status: 'in_progress', cost: 2200, group: 'in_progress' },
  { patientName: 'Savannah Moreno', procedure: 'Full orthodontic — palatal expander + braces', totalVisits: 22, visitsCompleted: 4, status: 'in_progress', cost: 6000, group: 'in_progress' },
  { patientName: 'Ryan Zhao', procedure: 'Gold crown #18 — custom fabrication', totalVisits: 3, visitsCompleted: 2, status: 'in_progress', cost: 1500, group: 'in_progress' },
  { patientName: 'Leah Fujimoto', procedure: 'Comprehensive orthodontic — Class II correction', totalVisits: 24, visitsCompleted: 12, status: 'in_progress', cost: 5800, group: 'in_progress' },

  // ─── Complete (7) ─────────────────────────────────────────────
  { patientName: 'Dylan Svensson', procedure: 'Dental implant #14 — full restoration', totalVisits: 5, visitsCompleted: 5, status: 'complete', cost: 4500, group: 'complete' },
  { patientName: 'Cooper Al-Rashid', procedure: 'PFM crown #30 — post root canal', totalVisits: 3, visitsCompleted: 3, status: 'complete', cost: 1200, group: 'complete' },
  { patientName: 'Eleanor Hawthorne', procedure: 'Root canal therapy #19 — completed', totalVisits: 2, visitsCompleted: 2, status: 'complete', cost: 1400, group: 'complete' },
  { patientName: 'Paisley Morrison', procedure: 'Orthodontic treatment — 18-month case', totalVisits: 18, visitsCompleted: 18, status: 'complete', cost: 5000, group: 'complete' },
  { patientName: 'Lincoln Garcia', procedure: 'Composite veneers #8-#9 (2 units)', totalVisits: 2, visitsCompleted: 2, status: 'complete', cost: 1200, group: 'complete' },
  { patientName: 'Bentley Okafor', procedure: 'Zirconia crown #3 — single visit CEREC', totalVisits: 1, visitsCompleted: 1, status: 'complete', cost: 1300, group: 'complete' },
  { patientName: 'Naomi Petersen', procedure: '4-unit fixed bridge #12-#15', totalVisits: 4, visitsCompleted: 4, status: 'complete', cost: 4000, group: 'complete' },

  // ─── On Hold (3) ──────────────────────────────────────────────
  { patientName: 'Samuel Björk', procedure: 'Filling #8 DO — awaiting insurance auth', totalVisits: 1, visitsCompleted: 0, status: 'on_hold', cost: 350, group: 'on_hold' },
  { patientName: 'Brooklyn Andersen', procedure: 'Composite filling #20 — patient requested delay', totalVisits: 1, visitsCompleted: 0, status: 'on_hold', cost: 280, group: 'on_hold' },
  { patientName: 'Adrian Nwosu', procedure: 'Root canal #14 — referred to endodontist', totalVisits: 3, visitsCompleted: 1, status: 'on_hold', cost: 1800, group: 'on_hold' },
];

export async function seedTreatments(ctx: DentaFlowContext, boards: DentaFlowBoards): Promise<void> {
  console.log('[DentaFlow] Seeding 30 treatment plan records...');

  const groupMap: Record<string, number> = {
    planned: boards.txPlannedGroupId,
    in_progress: boards.txInProgressGroupId,
    complete: boards.txCompleteGroupId,
    on_hold: boards.txOnHoldGroupId,
  };

  const dentistPool = ctx.dentistIds;

  for (let i = 0; i < TREATMENTS.length; i++) {
    const t = TREATMENTS[i];
    const assignedDentist = dentistPool[i % dentistPool.length];

    const item = await Item.create({
      boardId: boards.treatmentPlansId,
      groupId: groupMap[t.group],
      name: `TX-${String(1001 + i)} — ${t.patientName}`,
      position: i,
      createdBy: ctx.adminId,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.txPatientColId, value: { userId: assignedDentist, displayName: t.patientName } },
      { itemId: item.id, columnId: boards.txProcedureColId, value: { text: t.procedure } },
      { itemId: item.id, columnId: boards.txTotalVisitsColId, value: { number: t.totalVisits } },
      { itemId: item.id, columnId: boards.txVisitsCompletedColId, value: { number: t.visitsCompleted } },
      { itemId: item.id, columnId: boards.txStatusColId, value: { labelId: t.status } },
      { itemId: item.id, columnId: boards.txCostColId, value: { number: t.cost } },
    ]);
  }

  console.log(`[DentaFlow] Seeded ${TREATMENTS.length} treatment plans`);
}
