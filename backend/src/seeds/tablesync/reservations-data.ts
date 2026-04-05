import { Item, ColumnValue } from '../../models';
import { TableSyncContext } from './workspace';
import { BoardContext } from './boards';

interface ReservationRecord {
  guestName: string;
  status: string;
  partySize: number;
  reservationTime: string;
  table: string;
  notes: string;
}

const RESERVATIONS: ReservationRecord[] = [
  // ─── Requested (15) ─────────────────────────────────────────
  { guestName: 'Thompson Party', status: 'Requested', partySize: 4, reservationTime: '2026-04-05T18:30:00', table: 'table_7', notes: 'Anniversary dinner, would like a quiet corner' },
  { guestName: 'Garcia Birthday', status: 'Requested', partySize: 8, reservationTime: '2026-04-05T19:00:00', table: 'table_14', notes: 'Birthday celebration, will bring their own cake' },
  { guestName: 'Chen Family', status: 'Requested', partySize: 6, reservationTime: '2026-04-05T18:00:00', table: 'table_10', notes: 'Two children — need high chairs' },
  { guestName: 'Okafor, David', status: 'Requested', partySize: 2, reservationTime: '2026-04-06T19:30:00', table: 'table_3', notes: 'First visit, referred by colleague' },
  { guestName: 'Patel Business Dinner', status: 'Requested', partySize: 5, reservationTime: '2026-04-06T20:00:00', table: 'table_11', notes: 'Corporate dinner, need receipt for expense report' },
  { guestName: 'Williams, Sarah', status: 'Requested', partySize: 2, reservationTime: '2026-04-06T18:30:00', table: 'table_1', notes: 'Vegetarian — please have options ready' },
  { guestName: 'Nakamura Engagement', status: 'Requested', partySize: 2, reservationTime: '2026-04-07T19:00:00', table: 'table_5', notes: 'Engagement dinner — partner planning surprise' },
  { guestName: 'Lopez Family Reunion', status: 'Requested', partySize: 12, reservationTime: '2026-04-07T17:30:00', table: 'table_18', notes: 'Large group, need tables pushed together' },
  { guestName: 'Kim, Jessica', status: 'Requested', partySize: 3, reservationTime: '2026-04-07T18:00:00', table: 'table_4', notes: 'Nut allergy — critical' },
  { guestName: 'Anderson, Mark', status: 'Requested', partySize: 4, reservationTime: '2026-04-08T19:00:00', table: 'table_8', notes: '' },
  { guestName: 'Rivera Brunch', status: 'Requested', partySize: 6, reservationTime: '2026-04-08T11:00:00', table: 'table_12', notes: 'Weekend brunch reservation' },
  { guestName: 'Park, Jin', status: 'Requested', partySize: 2, reservationTime: '2026-04-08T20:00:00', table: 'table_2', notes: 'Late seating, coming after a show' },
  { guestName: 'O\'Brien, Fiona', status: 'Requested', partySize: 4, reservationTime: '2026-04-09T18:30:00', table: 'table_6', notes: 'Gluten-free options needed' },
  { guestName: 'Johansson, Erik', status: 'Requested', partySize: 2, reservationTime: '2026-04-09T19:30:00', table: 'table_1', notes: 'Prefers outdoor patio if available' },
  { guestName: 'Morales, Elena', status: 'Requested', partySize: 3, reservationTime: '2026-04-09T18:00:00', table: 'table_9', notes: '' },

  // ─── Confirmed (25) ────────────────────────────────────────
  { guestName: 'DeLuca Date Night', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-04T19:00:00', table: 'table_5', notes: 'Regular couple, prefers booth seating' },
  { guestName: 'Mitchell, Robert', status: 'Confirmed', partySize: 4, reservationTime: '2026-04-04T18:30:00', table: 'table_9', notes: 'Celebrating promotion' },
  { guestName: 'Tanaka, Yuki', status: 'Confirmed', partySize: 3, reservationTime: '2026-04-04T19:30:00', table: 'table_3', notes: 'One pescatarian in group' },
  { guestName: 'Hernandez Wine Club', status: 'Confirmed', partySize: 6, reservationTime: '2026-04-04T20:00:00', table: 'table_13', notes: 'Wine pairing menu requested' },
  { guestName: 'Brown, Michael', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-05T18:00:00', table: 'table_2', notes: 'Proposing tonight — champagne on ice' },
  { guestName: 'Wilson Anniversary', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-05T19:30:00', table: 'table_6', notes: '25th wedding anniversary, complimentary dessert noted' },
  { guestName: 'Nguyen, Linh', status: 'Confirmed', partySize: 4, reservationTime: '2026-04-05T18:30:00', table: 'table_8', notes: 'One child, need booster seat' },
  { guestName: 'Santos Corporate', status: 'Confirmed', partySize: 8, reservationTime: '2026-04-05T19:00:00', table: 'table_15', notes: 'Business dinner, separate checks' },
  { guestName: 'Turner, James', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-06T18:00:00', table: 'table_4', notes: 'VIP regular, preferred table' },
  { guestName: 'Schmidt Family', status: 'Confirmed', partySize: 5, reservationTime: '2026-04-06T17:30:00', table: 'table_11', notes: 'Early bird seating, kids menu needed' },
  { guestName: 'Kowalski, Anna', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-06T20:00:00', table: 'table_1', notes: 'Dairy-free diet' },
  { guestName: 'Reyes, Carlos', status: 'Confirmed', partySize: 3, reservationTime: '2026-04-06T19:00:00', table: 'table_7', notes: '' },
  { guestName: 'Hoffman Retirement', status: 'Confirmed', partySize: 10, reservationTime: '2026-04-07T18:00:00', table: 'table_17', notes: 'Retirement party, custom cake arranged' },
  { guestName: 'Ali, Fatima', status: 'Confirmed', partySize: 4, reservationTime: '2026-04-07T19:00:00', table: 'table_10', notes: 'Halal options needed' },
  { guestName: 'Foster, Grace', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-07T19:30:00', table: 'table_2', notes: 'Returning guest, enjoyed the tasting menu last time' },
  { guestName: 'Ivanov, Dmitri', status: 'Confirmed', partySize: 6, reservationTime: '2026-04-07T18:30:00', table: 'table_12', notes: 'Requesting Russian-speaking server if available' },
  { guestName: 'Murphy, Sean', status: 'Confirmed', partySize: 4, reservationTime: '2026-04-08T18:00:00', table: 'table_9', notes: 'Two vegetarians in group' },
  { guestName: 'Chang, Wei', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-08T19:00:00', table: 'table_3', notes: '' },
  { guestName: 'Dubois, Marie', status: 'Confirmed', partySize: 3, reservationTime: '2026-04-08T19:30:00', table: 'table_6', notes: 'Visiting from Paris, interested in chef\'s table experience' },
  { guestName: 'Taylor Birthday', status: 'Confirmed', partySize: 8, reservationTime: '2026-04-08T18:30:00', table: 'table_16', notes: '30th birthday celebration, balloons OK?' },
  { guestName: 'Singh, Priya', status: 'Confirmed', partySize: 4, reservationTime: '2026-04-09T18:00:00', table: 'table_8', notes: 'Strict vegetarian' },
  { guestName: 'Nkosi, Thabo', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-09T19:00:00', table: 'table_4', notes: 'First date — please make it memorable' },
  { guestName: 'Yamamoto, Hiro', status: 'Confirmed', partySize: 5, reservationTime: '2026-04-09T18:30:00', table: 'table_11', notes: 'Omakase-style experience if possible' },
  { guestName: 'Campbell, Laura', status: 'Confirmed', partySize: 2, reservationTime: '2026-04-10T19:00:00', table: 'table_5', notes: '' },
  { guestName: 'Fischer, Hans', status: 'Confirmed', partySize: 3, reservationTime: '2026-04-10T18:30:00', table: 'table_7', notes: 'Prefers still water, not sparkling' },

  // ─── Seated (10) ───────────────────────────────────────────
  { guestName: 'Reed, Jonathan', status: 'Seated', partySize: 2, reservationTime: '2026-04-02T18:30:00', table: 'table_3', notes: 'Currently on second course' },
  { guestName: 'Martinez Celebration', status: 'Seated', partySize: 6, reservationTime: '2026-04-02T18:00:00', table: 'table_14', notes: 'Graduation dinner, dessert course next' },
  { guestName: 'Brooks, Emily', status: 'Seated', partySize: 4, reservationTime: '2026-04-02T19:00:00', table: 'table_8', notes: 'Just ordered appetizers' },
  { guestName: 'Olsen, Lars', status: 'Seated', partySize: 2, reservationTime: '2026-04-02T19:30:00', table: 'table_1', notes: 'Waiting on entrees' },
  { guestName: 'Gonzalez Family', status: 'Seated', partySize: 5, reservationTime: '2026-04-02T18:00:00', table: 'table_10', notes: 'Kids finished, adults on main course' },
  { guestName: 'Park, Soo-yeon', status: 'Seated', partySize: 2, reservationTime: '2026-04-02T19:00:00', table: 'table_5', notes: 'Wine pairing in progress' },
  { guestName: 'Laurent, Pierre', status: 'Seated', partySize: 3, reservationTime: '2026-04-02T18:30:00', table: 'table_7', notes: 'Chef\'s table experience' },
  { guestName: 'White, Rebecca', status: 'Seated', partySize: 4, reservationTime: '2026-04-02T19:00:00', table: 'table_9', notes: 'Cocktail round, haven\'t ordered food yet' },
  { guestName: 'Ibrahim, Hassan', status: 'Seated', partySize: 2, reservationTime: '2026-04-02T19:30:00', table: 'table_2', notes: 'Finishing appetizers' },
  { guestName: 'Svensson, Astrid', status: 'Seated', partySize: 4, reservationTime: '2026-04-02T18:00:00', table: 'table_12', notes: 'Dessert and coffee ordered' },

  // ─── Completed (35) ────────────────────────────────────────
  { guestName: 'Johnson, Emily', status: 'Completed', partySize: 2, reservationTime: '2026-04-01T18:00:00', table: 'table_1', notes: 'Excellent evening, left positive Yelp review' },
  { guestName: 'Lee, David', status: 'Completed', partySize: 4, reservationTime: '2026-04-01T18:30:00', table: 'table_8', notes: 'Business dinner, tipped 25%' },
  { guestName: 'Russo Family', status: 'Completed', partySize: 6, reservationTime: '2026-04-01T17:30:00', table: 'table_13', notes: 'Family gathering, everyone loved the risotto' },
  { guestName: 'Bergman, Ingrid', status: 'Completed', partySize: 2, reservationTime: '2026-04-01T19:00:00', table: 'table_5', notes: 'Wine tasting menu, bought 2 bottles to take home' },
  { guestName: 'Harrison, Tom', status: 'Completed', partySize: 3, reservationTime: '2026-04-01T19:30:00', table: 'table_4', notes: '' },
  { guestName: 'Choi, Min-jun', status: 'Completed', partySize: 2, reservationTime: '2026-04-01T20:00:00', table: 'table_2', notes: 'Late seating, quick service appreciated' },
  { guestName: 'Baker, Sarah', status: 'Completed', partySize: 4, reservationTime: '2026-03-31T18:30:00', table: 'table_9', notes: 'Celebration dinner, enjoyed everything' },
  { guestName: 'Fernandez, Miguel', status: 'Completed', partySize: 2, reservationTime: '2026-03-31T19:00:00', table: 'table_3', notes: 'Regular guest, third visit this month' },
  { guestName: 'Cohen, Rachel', status: 'Completed', partySize: 5, reservationTime: '2026-03-31T18:00:00', table: 'table_11', notes: 'Kosher requests accommodated' },
  { guestName: 'Young, Peter', status: 'Completed', partySize: 2, reservationTime: '2026-03-31T19:30:00', table: 'table_6', notes: 'Proposed during dessert!' },
  { guestName: 'Khan, Amira', status: 'Completed', partySize: 4, reservationTime: '2026-03-31T18:30:00', table: 'table_10', notes: 'All halal dishes, very satisfied' },
  { guestName: 'Petrov, Alexei', status: 'Completed', partySize: 3, reservationTime: '2026-03-31T20:00:00', table: 'table_7', notes: 'Vodka tasting added to bill' },
  { guestName: 'Clark, Jessica', status: 'Completed', partySize: 2, reservationTime: '2026-03-30T18:00:00', table: 'table_4', notes: '' },
  { guestName: 'Wong, Kevin', status: 'Completed', partySize: 6, reservationTime: '2026-03-30T18:30:00', table: 'table_15', notes: 'Team dinner, appreciated the group menu' },
  { guestName: 'Adams, Christine', status: 'Completed', partySize: 2, reservationTime: '2026-03-30T19:00:00', table: 'table_1', notes: 'First time, already booked return visit' },
  { guestName: 'Novak, Pavel', status: 'Completed', partySize: 4, reservationTime: '2026-03-30T19:30:00', table: 'table_8', notes: '' },
  { guestName: 'Hall, Andrew', status: 'Completed', partySize: 2, reservationTime: '2026-03-30T18:00:00', table: 'table_2', notes: 'Quiet dinner, everything perfect' },
  { guestName: 'Demir, Elif', status: 'Completed', partySize: 3, reservationTime: '2026-03-30T18:30:00', table: 'table_6', notes: 'Turkish coffee after dinner was a hit' },
  { guestName: 'Ortiz, Maria', status: 'Completed', partySize: 8, reservationTime: '2026-03-29T17:30:00', table: 'table_16', notes: 'Birthday celebration, complimentary slice served' },
  { guestName: 'Larsen, Henrik', status: 'Completed', partySize: 2, reservationTime: '2026-03-29T19:00:00', table: 'table_3', notes: 'Seafood tasting, very impressed' },
  { guestName: 'Evans, Megan', status: 'Completed', partySize: 4, reservationTime: '2026-03-29T18:30:00', table: 'table_9', notes: 'Double date, split the check' },
  { guestName: 'Zhou, Wei', status: 'Completed', partySize: 2, reservationTime: '2026-03-29T19:30:00', table: 'table_5', notes: '' },
  { guestName: 'Bianchi, Luca', status: 'Completed', partySize: 5, reservationTime: '2026-03-29T18:00:00', table: 'table_12', notes: 'Italian guest, complimented the pasta authenticity' },
  { guestName: 'Hughes, Daniel', status: 'Completed', partySize: 2, reservationTime: '2026-03-28T19:00:00', table: 'table_4', notes: 'Quiet romantic dinner' },
  { guestName: 'Devi, Ananya', status: 'Completed', partySize: 4, reservationTime: '2026-03-28T18:30:00', table: 'table_10', notes: 'Vegetarian group, loved the seasonal menu' },
  { guestName: 'Porter, William', status: 'Completed', partySize: 3, reservationTime: '2026-03-28T19:30:00', table: 'table_7', notes: '' },
  { guestName: 'Kato, Sakura', status: 'Completed', partySize: 2, reservationTime: '2026-03-28T18:00:00', table: 'table_1', notes: 'Asked about private dining for future event' },
  { guestName: 'Reynolds, Grace', status: 'Completed', partySize: 6, reservationTime: '2026-03-28T17:30:00', table: 'table_14', notes: 'Bridal shower, group menu selected' },
  { guestName: 'Mendez, Carlos', status: 'Completed', partySize: 2, reservationTime: '2026-03-27T19:00:00', table: 'table_2', notes: 'Regular, always orders the steak' },
  { guestName: 'Eriksson, Maja', status: 'Completed', partySize: 4, reservationTime: '2026-03-27T18:30:00', table: 'table_8', notes: 'Chef\'s table experience — 5-star review incoming' },
  { guestName: 'Cooper, Olivia', status: 'Completed', partySize: 2, reservationTime: '2026-03-27T19:30:00', table: 'table_6', notes: '' },
  { guestName: 'Gupta, Rahul', status: 'Completed', partySize: 3, reservationTime: '2026-03-27T18:00:00', table: 'table_3', notes: 'Spice-tolerant, appreciated the heat levels' },
  { guestName: 'Bennett, Emma', status: 'Completed', partySize: 4, reservationTime: '2026-03-26T18:30:00', table: 'table_11', notes: 'Girls night, cocktail service was great' },
  { guestName: 'Ito, Takeshi', status: 'Completed', partySize: 2, reservationTime: '2026-03-26T19:00:00', table: 'table_5', notes: 'Sake pairing with entrees' },
  { guestName: 'O\'Connor, Patrick', status: 'Completed', partySize: 6, reservationTime: '2026-03-26T17:30:00', table: 'table_13', notes: 'St. Patrick\'s week special menu, great feedback' },

  // ─── No-Show (8) ───────────────────────────────────────────
  { guestName: 'Davis, Michael', status: 'No-Show', partySize: 2, reservationTime: '2026-04-01T19:00:00', table: 'table_4', notes: 'No call, no show. First offense.' },
  { guestName: 'Robinson, Ashley', status: 'No-Show', partySize: 4, reservationTime: '2026-04-01T18:30:00', table: 'table_10', notes: 'Repeat no-show — flag for future bookings' },
  { guestName: 'Green, Thomas', status: 'No-Show', partySize: 2, reservationTime: '2026-03-31T19:30:00', table: 'table_2', notes: 'No call, table held for 20 minutes' },
  { guestName: 'Nelson, Jennifer', status: 'No-Show', partySize: 3, reservationTime: '2026-03-30T18:00:00', table: 'table_6', notes: '' },
  { guestName: 'Carter, Brian', status: 'No-Show', partySize: 6, reservationTime: '2026-03-29T18:30:00', table: 'table_14', notes: 'Large party no-show, significant revenue loss' },
  { guestName: 'Ross, Amanda', status: 'No-Show', partySize: 2, reservationTime: '2026-03-29T19:00:00', table: 'table_3', notes: 'Called next day to apologize, emergency' },
  { guestName: 'Stewart, Kevin', status: 'No-Show', partySize: 4, reservationTime: '2026-03-28T19:00:00', table: 'table_9', notes: 'Second no-show this quarter' },
  { guestName: 'Phillips, Diana', status: 'No-Show', partySize: 2, reservationTime: '2026-03-27T18:30:00', table: 'table_1', notes: 'No response to confirmation call' },

  // ─── Cancelled (7) ─────────────────────────────────────────
  { guestName: 'Morris, Linda', status: 'Cancelled', partySize: 4, reservationTime: '2026-04-03T18:30:00', table: 'table_8', notes: 'Called to cancel — family emergency' },
  { guestName: 'Howard, Steve', status: 'Cancelled', partySize: 2, reservationTime: '2026-04-03T19:00:00', table: 'table_5', notes: 'Rescheduled to next Friday' },
  { guestName: 'King, Victoria', status: 'Cancelled', partySize: 6, reservationTime: '2026-04-02T18:00:00', table: 'table_13', notes: 'Group plans changed, cancelled 48hr in advance' },
  { guestName: 'Wright, Jason', status: 'Cancelled', partySize: 2, reservationTime: '2026-04-01T19:30:00', table: 'table_2', notes: 'Under the weather' },
  { guestName: 'Lee, Jenny', status: 'Cancelled', partySize: 3, reservationTime: '2026-03-31T18:00:00', table: 'table_7', notes: 'Conflict with another event' },
  { guestName: 'Scott, Daniel', status: 'Cancelled', partySize: 8, reservationTime: '2026-03-30T17:30:00', table: 'table_16', notes: 'Corporate event moved to different venue' },
  { guestName: 'Torres, Isabel', status: 'Cancelled', partySize: 2, reservationTime: '2026-03-29T19:30:00', table: 'table_4', notes: 'Last-minute work conflict' },
];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Requested'];
}

export async function seedReservations(
  ctx: TableSyncContext,
  board: BoardContext
): Promise<void> {
  console.log(`[TableSync] Seeding ${RESERVATIONS.length} reservations...`);

  const guestUsers = [ctx.hostManagerId, ctx.serverLeadId, ctx.userId, ctx.gmId, ctx.eventCoordinatorId];

  for (let i = 0; i < RESERVATIONS.length; i++) {
    const r = RESERVATIONS[i];
    const groupId = getGroupForStatus(r.status, board.groups);

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: r.guestName,
      position: i,
      createdBy: ctx.hostManagerId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Guest Name'], value: guestUsers[i % guestUsers.length] },
      { itemId: item.id, columnId: board.columns['Status'], value: r.status },
      { itemId: item.id, columnId: board.columns['Party Size'], value: r.partySize },
      { itemId: item.id, columnId: board.columns['Reservation Time'], value: r.reservationTime },
      { itemId: item.id, columnId: board.columns['Table'], value: r.table },
      { itemId: item.id, columnId: board.columns['Special Notes'], value: r.notes },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[TableSync] Seeded ${RESERVATIONS.length} reservations across ${Object.keys(board.groups).length} groups`);
}

export { RESERVATIONS };
