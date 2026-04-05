import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { UrbanNestContext } from './workspace';
import { BoardContext } from './boards';

interface ShowingRecord {
  property: string;
  prospect: string;
  showingDate: string;
  status: string;
  feedback: string;
  interestLevel: number;
  followUpDate: string;
}

const SHOWINGS: ShowingRecord[] = [
  // ─── Scheduled (12) ────────────────────────────────────────────────────
  { property: '742 Oakwood Dr', prospect: 'Paul & Janet Rivera', showingDate: '2026-04-05T10:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-06' },
  { property: '310 Sunrise Terrace', prospect: 'Paul & Janet Rivera', showingDate: '2026-04-05T11:30:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-06' },
  { property: '2055 Harbor Blvd #7C', prospect: 'Michelle Lee', showingDate: '2026-04-04T14:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-05' },
  { property: '205 Harbor Walk #5E', prospect: 'Michelle Lee', showingDate: '2026-04-04T15:30:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-05' },
  { property: '1888 Magnolia Blvd', prospect: 'Derek & Susan Grant', showingDate: '2026-04-06T10:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-07' },
  { property: '2400 Summit Ridge Rd', prospect: 'Derek & Susan Grant', showingDate: '2026-04-06T12:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-07' },
  { property: '67 Willow Creek Rd', prospect: 'Laura Bennett', showingDate: '2026-04-05T13:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-06' },
  { property: '501 Fieldstone Dr', prospect: 'Ahmad Hassan', showingDate: '2026-04-07T09:30:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-08' },
  { property: '1340 Heritage Hill Dr', prospect: 'Ahmad Hassan', showingDate: '2026-04-07T11:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-08' },
  { property: '1200 Market St #15F', prospect: 'Samantha Wright', showingDate: '2026-04-08T16:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-09' },
  { property: '4200 Crescent Park Blvd #20G', prospect: 'Samantha Wright', showingDate: '2026-04-08T17:30:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-09' },
  { property: '2330 Dune Way', prospect: 'Raymond & Carol Dunn', showingDate: '2026-04-05T14:00:00', status: 'Scheduled', feedback: '', interestLevel: 0, followUpDate: '2026-04-06' },

  // ─── Completed (15) ────────────────────────────────────────────────────
  { property: '1420 Cedar Ridge Way', prospect: 'Steven & Allison Park', showingDate: '2026-03-22T10:00:00', status: 'Completed', feedback: 'Fell in love with the craftsman details and mountain views. Wrap-around porch was a huge hit. Want to submit an offer.', interestLevel: 5, followUpDate: '2026-03-23' },
  { property: '300 Park Place #12A', prospect: 'Margaret Johansson', showingDate: '2026-03-20T14:00:00', status: 'Completed', feedback: 'Impressed by the concierge and rooftop. Unit layout works perfectly for her. Making an offer at asking.', interestLevel: 5, followUpDate: '2026-03-21' },
  { property: '1605 Ashford Glen', prospect: 'Chris & Angela Reeves', showingDate: '2026-03-23T11:00:00', status: 'Completed', feedback: 'Love the modern farmhouse style. Kitchen is perfect. Concerned about competing offers.', interestLevel: 5, followUpDate: '2026-03-24' },
  { property: '820 Aspen Ct', prospect: 'William Foster', showingDate: '2026-03-19T15:00:00', status: 'Completed', feedback: 'Solid home, good bones. Bonus room is a plus. Wants to negotiate on price — thinks it is slightly high.', interestLevel: 4, followUpDate: '2026-03-20' },
  { property: '501 Fieldstone Dr', prospect: 'Sarah & Tom Brennan', showingDate: '2026-03-21T10:30:00', status: 'Completed', feedback: 'Perfect for their family. Love the greenspace behind the house. Kids loved the yard. Submitted offer same day.', interestLevel: 5, followUpDate: '2026-03-22' },
  { property: '2330 Dune Way', prospect: 'Alicia Moreno', showingDate: '2026-03-24T13:00:00', status: 'Completed', feedback: 'Rooftop deck sealed the deal. Ocean breezes are real. Wants to move forward with an offer.', interestLevel: 5, followUpDate: '2026-03-25' },
  { property: '88 Laurel Heights Rd', prospect: 'Peter & Diane Young', showingDate: '2026-03-18T10:00:00', status: 'Completed', feedback: 'In-law suite is exactly what they need for parents. Solar panels a bonus. Impressed with 10-ft ceilings.', interestLevel: 5, followUpDate: '2026-03-19' },
  { property: '55 Birch Hill Ct', prospect: 'Daniel & Sophia Kline', showingDate: '2026-03-15T11:00:00', status: 'Completed', feedback: 'Great house but slightly over budget. Pool is amazing but they are worried about maintenance costs. Thinking it over.', interestLevel: 3, followUpDate: '2026-03-17' },
  { property: '445 Cypress Creek Blvd', prospect: 'Nathan & Brittany Cole', showingDate: '2026-03-25T14:00:00', status: 'Completed', feedback: 'Loved the lanai and saltwater pool. Perfect for the twins. Want to see one more property before deciding.', interestLevel: 4, followUpDate: '2026-03-27' },
  { property: '3010 Vista Grande Cir', prospect: 'Diana Christensen', showingDate: '2026-03-26T10:00:00', status: 'Completed', feedback: 'Architecture is interesting but the loft layout does not match her vision. City views are stunning though. Passing for now.', interestLevel: 2, followUpDate: '2026-03-28' },
  { property: '1050 Grand Oak Ave', prospect: 'Roger & Mei-Lin Huang', showingDate: '2026-03-27T09:00:00', status: 'Completed', feedback: 'Workshop could work as in-law suite conversion. 1-acre lot gives the space they need. Interested but need to research zoning.', interestLevel: 4, followUpDate: '2026-03-29' },
  { property: '78 Cobblestone Way', prospect: 'Victoria Simmons', showingDate: '2026-03-23T15:00:00', status: 'Completed', feedback: 'Rooftop deck is great. Community pool is a plus. Interior a bit smaller than expected. Still considering.', interestLevel: 3, followUpDate: '2026-03-25' },
  { property: '610 Pebble Brook Rd', prospect: 'Andrew Fischer', showingDate: '2026-03-22T14:00:00', status: 'Completed', feedback: 'Patio is nice but garage too small for workshop. Needs at least a 2.5 car garage. Passing.', interestLevel: 2, followUpDate: '2026-03-24' },
  { property: '227 Sycamore Sq #8B', prospect: 'Jessica Okafor', showingDate: '2026-03-20T16:00:00', status: 'Completed', feedback: 'Nice unit but no mountain view from this one. Fitness center is great. Want to see higher floors.', interestLevel: 3, followUpDate: '2026-03-22' },
  { property: '1775 Ivy Terrace #3A', prospect: 'Kristin Palmer', showingDate: '2026-03-21T13:00:00', status: 'Completed', feedback: 'Dog park on-site is perfect. Corner unit is bright. Quartz counters are beautiful. Very interested, checking with lender.', interestLevel: 4, followUpDate: '2026-03-23' },

  // ─── Cancelled (3) ─────────────────────────────────────────────────────
  { property: '155 Chestnut Ave', prospect: 'Anthony DiMaggio', showingDate: '2026-03-18T10:00:00', status: 'Cancelled', feedback: 'Cancelled — buyer found another fixer-upper closer to his current location.', interestLevel: 1, followUpDate: '2026-03-20' },
  { property: '92 Lakeside Path #2D', prospect: 'Omar Sayed', showingDate: '2026-03-16T14:00:00', status: 'Cancelled', feedback: 'Cancelled — investor decided to focus on larger units only.', interestLevel: 1, followUpDate: '2026-03-18' },
  { property: '425 Pine Valley Dr', prospect: 'Catherine Bell', showingDate: '2026-03-17T11:00:00', status: 'Cancelled', feedback: 'Cancelled — listing photos showed stairs, not truly single-story as described. Corrected in listing.', interestLevel: 0, followUpDate: '2026-03-19' },
];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  const mapping: Record<string, string> = {
    'Scheduled': 'Scheduled',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'No Show': 'Cancelled',
  };
  return groups[mapping[status] || 'Scheduled'];
}

export async function seedShowings(
  ctx: UrbanNestContext,
  board: BoardContext
): Promise<void> {
  console.log(`[UrbanNest] Seeding ${SHOWINGS.length} showings...`);

  const agents = ctx.agentIds;

  for (let i = 0; i < SHOWINGS.length; i++) {
    const s = SHOWINGS[i];
    const groupId = getGroupForStatus(s.status, board.groups);

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: `${s.property} — ${s.prospect}`,
      position: i,
      createdBy: ctx.adminId,
    });

    const values: Array<{ itemId: number; columnId: number; value: unknown }> = [
      { itemId: item.id, columnId: board.columns['Property'], value: s.property },
      { itemId: item.id, columnId: board.columns['Prospect'], value: s.prospect },
      { itemId: item.id, columnId: board.columns['Showing Date'], value: s.showingDate },
      { itemId: item.id, columnId: board.columns['Status'], value: s.status },
      { itemId: item.id, columnId: board.columns['Agent'], value: agents[i % agents.length] },
      { itemId: item.id, columnId: board.columns['Follow-Up Date'], value: s.followUpDate },
    ];

    if (s.feedback) {
      values.push({ itemId: item.id, columnId: board.columns['Feedback'], value: s.feedback });
    }
    if (s.interestLevel > 0) {
      values.push({ itemId: item.id, columnId: board.columns['Interest Level'], value: s.interestLevel });
    }

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[UrbanNest] Seeded ${SHOWINGS.length} showings`);
}
