import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { DentaFlowContext } from './workspace';
import { DentaFlowBoards } from './boards';

// ─── 50 Appointment Records ─────────────────────────────────────────────────
// Across 5 chairs, 6 dentists, no time overlaps per chair
// Statuses: ~15 Scheduled, ~12 Confirmed, ~15 Completed, ~8 Cancelled

interface AppointmentRecord {
  patientName: string;
  dentistIndex: number;   // 0-5 into dentistIds array
  dateTime: string;       // ISO datetime
  chair: string;          // chair_1 through chair_5
  status: string;         // scheduled | confirmed | completed | cancelled
  treatment: string;
  group: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

const APPOINTMENTS: AppointmentRecord[] = [
  // ─── Scheduled (15) — upcoming appointments ────────────────────
  { patientName: 'Olivia Thompson', dentistIndex: 0, dateTime: '2026-04-07T09:00:00', chair: 'chair_1', status: 'scheduled', treatment: 'Routine cleaning & exam', group: 'scheduled' },
  { patientName: 'Liam Nakamura', dentistIndex: 1, dateTime: '2026-04-07T09:30:00', chair: 'chair_2', status: 'scheduled', treatment: 'Composite filling #14', group: 'scheduled' },
  { patientName: 'Sophia Ramirez', dentistIndex: 2, dateTime: '2026-04-07T10:00:00', chair: 'chair_3', status: 'scheduled', treatment: 'Prophylaxis cleaning', group: 'scheduled' },
  { patientName: 'Noah Adeyemi', dentistIndex: 3, dateTime: '2026-04-07T10:30:00', chair: 'chair_4', status: 'scheduled', treatment: 'Crown prep #19', group: 'scheduled' },
  { patientName: 'Emma Johansson', dentistIndex: 4, dateTime: '2026-04-07T11:00:00', chair: 'chair_5', status: 'scheduled', treatment: 'Periodic exam & X-rays', group: 'scheduled' },
  { patientName: 'James O\'Brien', dentistIndex: 5, dateTime: '2026-04-07T11:30:00', chair: 'chair_1', status: 'scheduled', treatment: 'Root canal evaluation #30', group: 'scheduled' },
  { patientName: 'Isabella Park', dentistIndex: 0, dateTime: '2026-04-07T13:00:00', chair: 'chair_2', status: 'scheduled', treatment: 'New patient exam', group: 'scheduled' },
  { patientName: 'Benjamin Kowalski', dentistIndex: 1, dateTime: '2026-04-07T13:30:00', chair: 'chair_3', status: 'scheduled', treatment: 'Filling replacement #3', group: 'scheduled' },
  { patientName: 'Mia Patel', dentistIndex: 2, dateTime: '2026-04-07T14:00:00', chair: 'chair_4', status: 'scheduled', treatment: 'Orthodontic consultation', group: 'scheduled' },
  { patientName: 'Alexander Dubois', dentistIndex: 3, dateTime: '2026-04-08T09:00:00', chair: 'chair_1', status: 'scheduled', treatment: 'Routine cleaning', group: 'scheduled' },
  { patientName: 'Charlotte Kim', dentistIndex: 4, dateTime: '2026-04-08T09:30:00', chair: 'chair_2', status: 'scheduled', treatment: 'Composite filling #12', group: 'scheduled' },
  { patientName: 'William Santos', dentistIndex: 5, dateTime: '2026-04-08T10:00:00', chair: 'chair_3', status: 'scheduled', treatment: 'Prophylaxis & fluoride', group: 'scheduled' },
  { patientName: 'Amelia Bergstrom', dentistIndex: 0, dateTime: '2026-04-08T10:30:00', chair: 'chair_4', status: 'scheduled', treatment: 'Crown cementation #30', group: 'scheduled' },
  { patientName: 'Ethan Okonkwo', dentistIndex: 1, dateTime: '2026-04-08T11:00:00', chair: 'chair_5', status: 'scheduled', treatment: 'Scaling & root planing', group: 'scheduled' },
  { patientName: 'Harper Torres', dentistIndex: 2, dateTime: '2026-04-08T13:00:00', chair: 'chair_1', status: 'scheduled', treatment: 'Amalgam filling #18', group: 'scheduled' },

  // ─── Confirmed (12) — verified upcoming ────────────────────────
  { patientName: 'Daniel Moreau', dentistIndex: 3, dateTime: '2026-04-08T13:30:00', chair: 'chair_2', status: 'confirmed', treatment: 'Filling #5 MOD', group: 'confirmed' },
  { patientName: 'Avery Tanaka', dentistIndex: 4, dateTime: '2026-04-08T14:00:00', chair: 'chair_3', status: 'confirmed', treatment: 'Routine cleaning', group: 'confirmed' },
  { patientName: 'Scarlett Hassan', dentistIndex: 5, dateTime: '2026-04-08T14:30:00', chair: 'chair_4', status: 'confirmed', treatment: 'Crown prep #2', group: 'confirmed' },
  { patientName: 'Henry Magnusson', dentistIndex: 0, dateTime: '2026-04-09T09:00:00', chair: 'chair_1', status: 'confirmed', treatment: 'Root canal #14', group: 'confirmed' },
  { patientName: 'Grace Washington', dentistIndex: 1, dateTime: '2026-04-09T09:30:00', chair: 'chair_2', status: 'confirmed', treatment: 'Prophylaxis cleaning', group: 'confirmed' },
  { patientName: 'Sebastian Ivanov', dentistIndex: 2, dateTime: '2026-04-09T10:00:00', chair: 'chair_3', status: 'confirmed', treatment: 'Orthodontic adjustment', group: 'confirmed' },
  { patientName: 'Zoey Almeida', dentistIndex: 3, dateTime: '2026-04-09T10:30:00', chair: 'chair_4', status: 'confirmed', treatment: 'Composite filling #8', group: 'confirmed' },
  { patientName: 'Jack Obeng', dentistIndex: 4, dateTime: '2026-04-09T11:00:00', chair: 'chair_5', status: 'confirmed', treatment: 'Temporary crown #19', group: 'confirmed' },
  { patientName: 'Lily Fernandez', dentistIndex: 5, dateTime: '2026-04-09T13:00:00', chair: 'chair_1', status: 'confirmed', treatment: 'Dental cleaning', group: 'confirmed' },
  { patientName: 'Owen Christensen', dentistIndex: 0, dateTime: '2026-04-09T13:30:00', chair: 'chair_2', status: 'confirmed', treatment: 'Filling #20 DO', group: 'confirmed' },
  { patientName: 'Zoe Abrams', dentistIndex: 1, dateTime: '2026-04-09T14:00:00', chair: 'chair_3', status: 'confirmed', treatment: 'Bracket placement upper', group: 'confirmed' },
  { patientName: 'Caleb Engström', dentistIndex: 2, dateTime: '2026-04-09T14:30:00', chair: 'chair_4', status: 'confirmed', treatment: 'Root canal continuation #19', group: 'confirmed' },

  // ─── Completed (15) — past appointments ────────────────────────
  { patientName: 'Emily Sato', dentistIndex: 0, dateTime: '2026-03-31T09:00:00', chair: 'chair_1', status: 'completed', treatment: 'Routine cleaning & exam', group: 'completed' },
  { patientName: 'Lucas Mitchell', dentistIndex: 1, dateTime: '2026-03-31T09:30:00', chair: 'chair_2', status: 'completed', treatment: 'Filling #15 MO', group: 'completed' },
  { patientName: 'Aria Nguyen', dentistIndex: 2, dateTime: '2026-03-31T10:00:00', chair: 'chair_3', status: 'completed', treatment: 'Prophylaxis cleaning', group: 'completed' },
  { patientName: 'Mason Rodriguez', dentistIndex: 3, dateTime: '2026-03-31T10:30:00', chair: 'chair_4', status: 'completed', treatment: 'Crown delivery #30', group: 'completed' },
  { patientName: 'Chloe Anderson', dentistIndex: 4, dateTime: '2026-03-31T11:00:00', chair: 'chair_5', status: 'completed', treatment: 'Periodic exam', group: 'completed' },
  { patientName: 'Logan Kim', dentistIndex: 5, dateTime: '2026-03-31T13:00:00', chair: 'chair_1', status: 'completed', treatment: 'Composite filling #29', group: 'completed' },
  { patientName: 'Ella Petrov', dentistIndex: 0, dateTime: '2026-03-31T13:30:00', chair: 'chair_2', status: 'completed', treatment: 'Cleaning with fluoride', group: 'completed' },
  { patientName: 'Aiden Martinez', dentistIndex: 1, dateTime: '2026-03-31T14:00:00', chair: 'chair_3', status: 'completed', treatment: 'Routine exam & cleaning', group: 'completed' },
  { patientName: 'Luna Okafor', dentistIndex: 2, dateTime: '2026-03-28T09:00:00', chair: 'chair_1', status: 'completed', treatment: 'Filling #4 OL', group: 'completed' },
  { patientName: 'Jackson Chen', dentistIndex: 3, dateTime: '2026-03-28T10:00:00', chair: 'chair_2', status: 'completed', treatment: 'Crown prep #19', group: 'completed' },
  { patientName: 'Penelope Brooks', dentistIndex: 4, dateTime: '2026-03-28T11:00:00', chair: 'chair_3', status: 'completed', treatment: 'Prophylaxis cleaning', group: 'completed' },
  { patientName: 'Carter Sullivan', dentistIndex: 5, dateTime: '2026-03-28T13:00:00', chair: 'chair_4', status: 'completed', treatment: 'Amalgam filling #19', group: 'completed' },
  { patientName: 'Layla Johansson', dentistIndex: 0, dateTime: '2026-03-28T14:00:00', chair: 'chair_5', status: 'completed', treatment: 'Dental cleaning', group: 'completed' },
  { patientName: 'Jayden Park', dentistIndex: 1, dateTime: '2026-03-27T09:30:00', chair: 'chair_1', status: 'completed', treatment: 'Orthodontic wire change', group: 'completed' },
  { patientName: 'Riley Hoffman', dentistIndex: 2, dateTime: '2026-03-27T10:30:00', chair: 'chair_2', status: 'completed', treatment: 'Routine cleaning', group: 'completed' },

  // ─── Cancelled (8) ─────────────────────────────────────────────
  { patientName: 'Nolan Watanabe', dentistIndex: 3, dateTime: '2026-04-07T14:30:00', chair: 'chair_5', status: 'cancelled', treatment: 'Filling #10', group: 'cancelled' },
  { patientName: 'Hazel Lindqvist', dentistIndex: 4, dateTime: '2026-04-08T15:00:00', chair: 'chair_5', status: 'cancelled', treatment: 'Cleaning', group: 'cancelled' },
  { patientName: 'Elijah Santos', dentistIndex: 5, dateTime: '2026-04-09T15:00:00', chair: 'chair_5', status: 'cancelled', treatment: 'Root canal evaluation', group: 'cancelled' },
  { patientName: 'Violet Adeyemi', dentistIndex: 0, dateTime: '2026-04-07T15:00:00', chair: 'chair_3', status: 'cancelled', treatment: 'Prophylaxis cleaning', group: 'cancelled' },
  { patientName: 'Gabriel Novak', dentistIndex: 1, dateTime: '2026-04-08T15:30:00', chair: 'chair_1', status: 'cancelled', treatment: 'Filling #22', group: 'cancelled' },
  { patientName: 'Stella Patel', dentistIndex: 2, dateTime: '2026-04-09T15:30:00', chair: 'chair_2', status: 'cancelled', treatment: 'Routine cleaning', group: 'cancelled' },
  { patientName: 'Leo Torres', dentistIndex: 3, dateTime: '2026-04-07T15:30:00', chair: 'chair_4', status: 'cancelled', treatment: 'Crown consultation', group: 'cancelled' },
  { patientName: 'Aurora Dubois', dentistIndex: 4, dateTime: '2026-04-08T16:00:00', chair: 'chair_3', status: 'cancelled', treatment: 'Dental exam', group: 'cancelled' },
];

export async function seedAppointments(ctx: DentaFlowContext, boards: DentaFlowBoards): Promise<void> {
  console.log('[DentaFlow] Seeding 50 appointment records...');

  const groupMap: Record<string, number> = {
    scheduled: boards.apptScheduledGroupId,
    confirmed: boards.apptConfirmedGroupId,
    completed: boards.apptCompletedGroupId,
    cancelled: boards.apptCancelledGroupId,
  };

  for (let i = 0; i < APPOINTMENTS.length; i++) {
    const a = APPOINTMENTS[i];
    const dentistId = ctx.dentistIds[a.dentistIndex];

    const item = await Item.create({
      boardId: boards.appointmentBoardId,
      groupId: groupMap[a.group],
      name: `${a.patientName} — ${a.treatment}`,
      position: i,
      createdBy: ctx.frontDeskId,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.apptPatientColId, value: { userId: ctx.frontDeskId, displayName: a.patientName } },
      { itemId: item.id, columnId: boards.apptDentistColId, value: { userId: dentistId, displayName: '' } },
      { itemId: item.id, columnId: boards.apptDateTimeColId, value: { date: a.dateTime } },
      { itemId: item.id, columnId: boards.apptChairColId, value: { selectedId: a.chair } },
      { itemId: item.id, columnId: boards.apptStatusColId, value: { labelId: a.status } },
      { itemId: item.id, columnId: boards.apptTreatmentColId, value: { text: a.treatment } },
    ]);
  }

  console.log(`[DentaFlow] Seeded ${APPOINTMENTS.length} appointments`);
}
