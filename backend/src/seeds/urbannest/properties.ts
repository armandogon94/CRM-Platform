import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { UrbanNestContext } from './workspace';
import { BoardContext } from './boards';

interface PropertyRecord {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  status: string;
  propertyType: string;
  neighborhood: string;
  listedDate: string;
  yearBuilt: number;
  description: string;
}

const PROPERTIES: PropertyRecord[] = [
  // ─── Active Listings (35) ──────────────────────────────────────────────
  { address: '742 Oakwood Dr', price: 485000, bedrooms: 4, bathrooms: 2.5, sqft: 2400, status: 'Active', propertyType: 'single_family', neighborhood: 'Oakwood Heights', listedDate: '2026-03-15', yearBuilt: 2004, description: 'Spacious 4BR colonial with updated kitchen, hardwood floors throughout, and a large fenced backyard.' },
  { address: '118 Maple Ln', price: 329000, bedrooms: 3, bathrooms: 2, sqft: 1850, status: 'Active', propertyType: 'single_family', neighborhood: 'Maplewood', listedDate: '2026-03-20', yearBuilt: 1998, description: 'Charming ranch-style home with open floor plan, granite countertops, and attached 2-car garage.' },
  { address: '2201 Riverside Ave #4B', price: 275000, bedrooms: 2, bathrooms: 2, sqft: 1100, status: 'Active', propertyType: 'condo', neighborhood: 'Riverside', listedDate: '2026-03-10', yearBuilt: 2015, description: 'Modern condo with river views, in-unit laundry, stainless appliances, and building gym access.' },
  { address: '55 Birch Hill Ct', price: 625000, bedrooms: 5, bathrooms: 3.5, sqft: 3200, status: 'Active', propertyType: 'single_family', neighborhood: 'Birch Hill Estates', listedDate: '2026-03-01', yearBuilt: 2010, description: 'Executive home with chef\'s kitchen, home office, finished basement, and heated pool.' },
  { address: '300 Park Place #12A', price: 410000, bedrooms: 3, bathrooms: 2, sqft: 1600, status: 'Active', propertyType: 'condo', neighborhood: 'Downtown', listedDate: '2026-03-18', yearBuilt: 2019, description: 'Luxury downtown condo with floor-to-ceiling windows, concierge service, and rooftop terrace.' },
  { address: '891 Elm St', price: 299000, bedrooms: 3, bathrooms: 1.5, sqft: 1650, status: 'Active', propertyType: 'single_family', neighborhood: 'Elmwood Park', listedDate: '2026-03-22', yearBuilt: 1985, description: 'Well-maintained split-level with updated bathrooms, new roof 2024, quiet tree-lined street.' },
  { address: '1420 Cedar Ridge Way', price: 545000, bedrooms: 4, bathrooms: 3, sqft: 2800, status: 'Active', propertyType: 'single_family', neighborhood: 'Cedar Ridge', listedDate: '2026-02-28', yearBuilt: 2007, description: 'Stunning craftsman with wrap-around porch, stone fireplace, and mountain views from master suite.' },
  { address: '67 Willow Creek Rd', price: 389000, bedrooms: 3, bathrooms: 2.5, sqft: 2100, status: 'Active', propertyType: 'townhouse', neighborhood: 'Willow Creek', listedDate: '2026-03-12', yearBuilt: 2016, description: 'End-unit townhouse with private patio, 2-car garage, and premium upgrades throughout.' },
  { address: '2055 Harbor Blvd #7C', price: 525000, bedrooms: 2, bathrooms: 2, sqft: 1350, status: 'Active', propertyType: 'condo', neighborhood: 'Harbor Point', listedDate: '2026-03-05', yearBuilt: 2021, description: 'Waterfront luxury condo, boat slip included, smart home features, and sunset views.' },
  { address: '310 Sunrise Terrace', price: 459000, bedrooms: 4, bathrooms: 2, sqft: 2200, status: 'Active', propertyType: 'single_family', neighborhood: 'Sunrise Hills', listedDate: '2026-03-25', yearBuilt: 2001, description: 'Bright and airy 4BR with skylights, updated kitchen with island, and large backyard.' },
  { address: '1888 Magnolia Blvd', price: 715000, bedrooms: 5, bathrooms: 4, sqft: 3600, status: 'Active', propertyType: 'single_family', neighborhood: 'Magnolia Estates', listedDate: '2026-02-20', yearBuilt: 2012, description: 'Grand estate home with guest suite, wine cellar, media room, and resort-style pool.' },
  { address: '425 Pine Valley Dr', price: 355000, bedrooms: 3, bathrooms: 2, sqft: 1900, status: 'Active', propertyType: 'single_family', neighborhood: 'Pine Valley', listedDate: '2026-03-28', yearBuilt: 1995, description: 'Classic colonial with renovated kitchen, gas fireplace, and cul-de-sac location.' },
  { address: '92 Lakeside Path #2D', price: 245000, bedrooms: 1, bathrooms: 1, sqft: 780, status: 'Active', propertyType: 'condo', neighborhood: 'Lakeside', listedDate: '2026-03-08', yearBuilt: 2018, description: 'Cozy lakeside studio+ with balcony, lake views, ideal for first-time buyer or investment.' },
  { address: '1605 Ashford Glen', price: 498000, bedrooms: 4, bathrooms: 3, sqft: 2600, status: 'Active', propertyType: 'single_family', neighborhood: 'Ashford', listedDate: '2026-03-14', yearBuilt: 2008, description: 'Modern farmhouse with shiplap accents, barn doors, gourmet kitchen, and three-season porch.' },
  { address: '78 Cobblestone Way', price: 375000, bedrooms: 3, bathrooms: 2.5, sqft: 2000, status: 'Active', propertyType: 'townhouse', neighborhood: 'Cobblestone Square', listedDate: '2026-03-19', yearBuilt: 2014, description: 'Brick-front townhouse with rooftop deck, walk-in closets, and community pool access.' },
  { address: '2400 Summit Ridge Rd', price: 875000, bedrooms: 6, bathrooms: 4.5, sqft: 4500, status: 'Active', propertyType: 'single_family', neighborhood: 'Summit Ridge', listedDate: '2026-02-15', yearBuilt: 2018, description: 'Luxury mountain retreat with panoramic views, home theater, elevator, and 4-car garage.' },
  { address: '155 Chestnut Ave', price: 285000, bedrooms: 2, bathrooms: 1, sqft: 1200, status: 'Active', propertyType: 'single_family', neighborhood: 'Old Town', listedDate: '2026-03-30', yearBuilt: 1952, description: 'Charming vintage bungalow with original hardwood, updated electrical, walkable to shops.' },
  { address: '3010 Vista Grande Cir', price: 565000, bedrooms: 4, bathrooms: 3, sqft: 2750, status: 'Active', propertyType: 'single_family', neighborhood: 'Vista Grande', listedDate: '2026-03-02', yearBuilt: 2009, description: 'Hilltop home with city views, outdoor kitchen, putting green, and spacious loft.' },
  { address: '820 Aspen Ct', price: 435000, bedrooms: 4, bathrooms: 2.5, sqft: 2350, status: 'Active', propertyType: 'single_family', neighborhood: 'Aspen Grove', listedDate: '2026-03-16', yearBuilt: 2003, description: '2-story traditional with bonus room, new HVAC, and mature landscaping.' },
  { address: '1200 Market St #15F', price: 365000, bedrooms: 2, bathrooms: 2, sqft: 1250, status: 'Active', propertyType: 'condo', neighborhood: 'Downtown', listedDate: '2026-03-21', yearBuilt: 2020, description: 'Brand-new downtown loft with exposed brick, chef\'s kitchen, and parking garage spot.' },
  { address: '445 Cypress Creek Blvd', price: 510000, bedrooms: 4, bathrooms: 3, sqft: 2550, status: 'Active', propertyType: 'single_family', neighborhood: 'Cypress Creek', listedDate: '2026-03-07', yearBuilt: 2011, description: 'Florida-style home with screened lanai, saltwater pool, and tropical landscaping.' },
  { address: '60 Briarwood Ln', price: 339000, bedrooms: 3, bathrooms: 2, sqft: 1750, status: 'Active', propertyType: 'single_family', neighborhood: 'Briarwood', listedDate: '2026-03-23', yearBuilt: 1990, description: 'Updated ranch with new flooring, recessed lighting, and fenced yard with shed.' },
  { address: '1775 Ivy Terrace #3A', price: 315000, bedrooms: 2, bathrooms: 2, sqft: 1150, status: 'Active', propertyType: 'condo', neighborhood: 'Ivy Park', listedDate: '2026-03-11', yearBuilt: 2017, description: 'Corner unit with extra windows, quartz counters, walk-in shower, and dog park on-site.' },
  { address: '501 Fieldstone Dr', price: 475000, bedrooms: 4, bathrooms: 2.5, sqft: 2450, status: 'Active', propertyType: 'single_family', neighborhood: 'Fieldstone', listedDate: '2026-03-17', yearBuilt: 2005, description: 'Pristine colonial with formal dining, mudroom, and backing to protected greenspace.' },
  { address: '88 Laurel Heights Rd', price: 599000, bedrooms: 5, bathrooms: 3.5, sqft: 3100, status: 'Active', propertyType: 'single_family', neighborhood: 'Laurel Heights', listedDate: '2026-02-25', yearBuilt: 2013, description: 'Contemporary 5BR with open concept, 10-ft ceilings, in-law suite, and solar panels.' },
  { address: '2330 Dune Way', price: 425000, bedrooms: 3, bathrooms: 2, sqft: 1800, status: 'Active', propertyType: 'townhouse', neighborhood: 'Seaside', listedDate: '2026-03-26', yearBuilt: 2019, description: 'Coastal townhome with ocean breezes, rooftop deck, and steps to the boardwalk.' },
  { address: '610 Pebble Brook Rd', price: 395000, bedrooms: 3, bathrooms: 2.5, sqft: 2050, status: 'Active', propertyType: 'single_family', neighborhood: 'Pebble Brook', listedDate: '2026-03-13', yearBuilt: 2000, description: 'Move-in ready 3BR with new windows, updated baths, and stamped concrete patio.' },
  { address: '1050 Grand Oak Ave', price: 685000, bedrooms: 5, bathrooms: 3, sqft: 3400, status: 'Active', propertyType: 'single_family', neighborhood: 'Grand Oaks', listedDate: '2026-03-04', yearBuilt: 2015, description: 'Elegant 5BR on 1-acre lot with circular drive, formal living, and detached workshop.' },
  { address: '227 Sycamore Sq #8B', price: 295000, bedrooms: 2, bathrooms: 1.5, sqft: 1050, status: 'Active', propertyType: 'condo', neighborhood: 'Sycamore', listedDate: '2026-03-29', yearBuilt: 2016, description: 'Low-maintenance condo with open kitchen, wood-look tile, and community fitness center.' },
  { address: '1340 Heritage Hill Dr', price: 529000, bedrooms: 4, bathrooms: 3, sqft: 2700, status: 'Active', propertyType: 'single_family', neighborhood: 'Heritage Hills', listedDate: '2026-03-09', yearBuilt: 2006, description: 'Spacious 4BR with upgraded everything: counters, fixtures, flooring. Premium HOA community.' },
  { address: '18 Fox Run Trail', price: 449000, bedrooms: 3, bathrooms: 2, sqft: 1950, status: 'Active', propertyType: 'single_family', neighborhood: 'Fox Meadow', listedDate: '2026-03-24', yearBuilt: 2002, description: 'Wooded setting on 0.5 acres, wraparound deck, wood-burning stove, and detached garage.' },
  { address: '4200 Crescent Park Blvd #20G', price: 475000, bedrooms: 3, bathrooms: 2, sqft: 1500, status: 'Active', propertyType: 'condo', neighborhood: 'Crescent Park', listedDate: '2026-03-06', yearBuilt: 2022, description: 'Top-floor penthouse-style unit with skyline views, wine fridge, and assigned storage.' },
  { address: '775 Ironwood Ct', price: 399000, bedrooms: 3, bathrooms: 2.5, sqft: 2150, status: 'Active', propertyType: 'townhouse', neighborhood: 'Ironwood Commons', listedDate: '2026-03-27', yearBuilt: 2017, description: 'New-build quality townhome with 9-ft ceilings, stone counters, and EV charging.' },
  { address: '1520 Amber Fields Way', price: 465000, bedrooms: 4, bathrooms: 2.5, sqft: 2500, status: 'Active', propertyType: 'single_family', neighborhood: 'Amber Fields', listedDate: '2026-03-03', yearBuilt: 2010, description: 'Family-friendly 4BR near top-rated schools, playroom, double pantry, and sprinkler system.' },
  { address: '205 Harbor Walk #5E', price: 340000, bedrooms: 2, bathrooms: 2, sqft: 1200, status: 'Active', propertyType: 'condo', neighborhood: 'Harbor Point', listedDate: '2026-03-31', yearBuilt: 2020, description: 'Harbor-view 2BR with balcony, secured parking, resort-style pool, and pet-friendly policy.' },

  // ─── Pending (10) ──────────────────────────────────────────────────────
  { address: '930 Rosewood Ln', price: 415000, bedrooms: 3, bathrooms: 2, sqft: 1900, status: 'Pending', propertyType: 'single_family', neighborhood: 'Rosewood', listedDate: '2026-02-10', yearBuilt: 1997, description: 'Under contract — charming Cape Cod with new kitchen, screened porch, and mature trees.' },
  { address: '1680 Falcon Crest Dr', price: 575000, bedrooms: 4, bathrooms: 3.5, sqft: 3000, status: 'Pending', propertyType: 'single_family', neighborhood: 'Falcon Crest', listedDate: '2026-02-18', yearBuilt: 2014, description: 'Pending sale — 4BR with theater room, wet bar, and 3-car tandem garage.' },
  { address: '410 Spring Garden Way #6D', price: 258000, bedrooms: 2, bathrooms: 1, sqft: 950, status: 'Pending', propertyType: 'condo', neighborhood: 'Spring Garden', listedDate: '2026-02-22', yearBuilt: 2013, description: 'Under contract — affordable condo with stainless appliances, in-unit washer/dryer.' },
  { address: '85 Stone Bridge Rd', price: 492000, bedrooms: 4, bathrooms: 2.5, sqft: 2450, status: 'Pending', propertyType: 'single_family', neighborhood: 'Stone Bridge', listedDate: '2026-02-05', yearBuilt: 2001, description: 'Offer accepted — colonial with circular drive, updated master bath, and heated garage.' },
  { address: '2750 Shoreline Dr', price: 685000, bedrooms: 3, bathrooms: 3, sqft: 2200, status: 'Pending', propertyType: 'townhouse', neighborhood: 'Shoreline', listedDate: '2026-01-28', yearBuilt: 2020, description: 'Pending — waterfront townhouse with private dock, elevator, and panoramic water views.' },
  { address: '320 Acacia Grove', price: 365000, bedrooms: 3, bathrooms: 2, sqft: 1800, status: 'Pending', propertyType: 'single_family', neighborhood: 'Acacia Park', listedDate: '2026-02-14', yearBuilt: 1992, description: 'Under contract — updated ranch with new windows, hardwood floors, and sun room.' },
  { address: '1100 Redwood Terrace #9A', price: 310000, bedrooms: 2, bathrooms: 2, sqft: 1100, status: 'Pending', propertyType: 'condo', neighborhood: 'Redwood', listedDate: '2026-02-08', yearBuilt: 2016, description: 'Pending — 2BR corner unit with mountain views, walk-in closet, and heated pool.' },
  { address: '555 Hawthorne Blvd', price: 445000, bedrooms: 4, bathrooms: 2, sqft: 2100, status: 'Pending', propertyType: 'single_family', neighborhood: 'Hawthorne', listedDate: '2026-02-12', yearBuilt: 1999, description: 'Under contract — well-kept 4BR with finished basement, new deck, and storage shed.' },
  { address: '60 Meadow Glen Ct', price: 520000, bedrooms: 4, bathrooms: 3, sqft: 2650, status: 'Pending', propertyType: 'single_family', neighborhood: 'Meadow Glen', listedDate: '2026-02-01', yearBuilt: 2011, description: 'Offer accepted — open-plan home with gourmet kitchen, outdoor fireplace, and sports court.' },
  { address: '1990 Bayview Ct #11C', price: 389000, bedrooms: 2, bathrooms: 2, sqft: 1300, status: 'Pending', propertyType: 'condo', neighborhood: 'Bayview', listedDate: '2026-02-16', yearBuilt: 2018, description: 'Pending — top-floor bayview condo with vaulted ceilings, gas fireplace, and underground parking.' },

  // ─── Sold (10) ─────────────────────────────────────────────────────────
  { address: '740 Brookside Ave', price: 405000, bedrooms: 3, bathrooms: 2, sqft: 1850, status: 'Sold', propertyType: 'single_family', neighborhood: 'Brookside', listedDate: '2025-11-15', yearBuilt: 1996, description: 'Sold — renovated Cape Cod with chef\'s kitchen, bluestone patio, and tree-lined street.' },
  { address: '2100 Summit View #3F', price: 298000, bedrooms: 2, bathrooms: 1.5, sqft: 1000, status: 'Sold', propertyType: 'condo', neighborhood: 'Summit View', listedDate: '2025-12-01', yearBuilt: 2014, description: 'Sold — mountain-view condo with modern finishes and covered parking.' },
  { address: '1325 Winding Creek Path', price: 535000, bedrooms: 4, bathrooms: 3, sqft: 2800, status: 'Sold', propertyType: 'single_family', neighborhood: 'Winding Creek', listedDate: '2025-10-20', yearBuilt: 2007, description: 'Sold — 4BR with finished walkout basement, hot tub, and backing to nature preserve.' },
  { address: '48 Garden Gate Way', price: 365000, bedrooms: 3, bathrooms: 2.5, sqft: 1950, status: 'Sold', propertyType: 'townhouse', neighborhood: 'Garden Gate', listedDate: '2025-12-10', yearBuilt: 2015, description: 'Sold — end-unit townhome with private yard, updated lighting, and 2-car garage.' },
  { address: '3500 Oceanfront Dr', price: 925000, bedrooms: 5, bathrooms: 4, sqft: 3800, status: 'Sold', propertyType: 'single_family', neighborhood: 'Oceanfront', listedDate: '2025-09-15', yearBuilt: 2019, description: 'Sold — beachfront luxury home with infinity pool, outdoor shower, and guest casita.' },
  { address: '615 Magnolia Crossing', price: 315000, bedrooms: 3, bathrooms: 2, sqft: 1700, status: 'Sold', propertyType: 'single_family', neighborhood: 'Magnolia Estates', listedDate: '2025-11-05', yearBuilt: 1988, description: 'Sold — freshly painted 3BR with renovated kitchen, new appliances, and privacy fence.' },
  { address: '1800 Cliffside Terrace', price: 480000, bedrooms: 4, bathrooms: 2.5, sqft: 2400, status: 'Sold', propertyType: 'single_family', neighborhood: 'Cliffside', listedDate: '2025-10-01', yearBuilt: 2005, description: 'Sold — hilltop home with expansive views, dual-zone HVAC, and custom built-ins.' },
  { address: '250 Lakeview Plaza #14B', price: 269000, bedrooms: 1, bathrooms: 1, sqft: 800, status: 'Sold', propertyType: 'condo', neighborhood: 'Lakeside', listedDate: '2025-12-15', yearBuilt: 2017, description: 'Sold — compact lakefront unit with high-end finishes, perfect investment property.' },
  { address: '905 Thornberry Ln', price: 445000, bedrooms: 4, bathrooms: 2, sqft: 2200, status: 'Sold', propertyType: 'single_family', neighborhood: 'Thornberry', listedDate: '2025-11-20', yearBuilt: 2000, description: 'Sold — colonial 4BR with new roof, tankless water heater, and large screened porch.' },
  { address: '1450 Silverbell Way', price: 510000, bedrooms: 4, bathrooms: 3, sqft: 2700, status: 'Sold', propertyType: 'single_family', neighborhood: 'Silverbell', listedDate: '2025-10-10', yearBuilt: 2012, description: 'Sold — modern farmhouse with barn doors, spa bath, and professional landscaping.' },

  // ─── Expired / Withdrawn (5) ───────────────────────────────────────────
  { address: '33 Old Mill Rd', price: 550000, bedrooms: 4, bathrooms: 2, sqft: 2300, status: 'Expired', propertyType: 'single_family', neighborhood: 'Old Mill', listedDate: '2025-06-01', yearBuilt: 1978, description: 'Expired — needs updating, priced above comps. Owner considering renovation before relisting.' },
  { address: '1700 Desert Bloom Ct', price: 420000, bedrooms: 3, bathrooms: 2, sqft: 1850, status: 'Expired', propertyType: 'single_family', neighborhood: 'Desert Bloom', listedDate: '2025-07-15', yearBuilt: 1994, description: 'Withdrawn — seller decided to rent instead. May relist in Q3.' },
  { address: '480 Bayberry Ln', price: 289000, bedrooms: 2, bathrooms: 1.5, sqft: 1100, status: 'Expired', propertyType: 'townhouse', neighborhood: 'Bayberry', listedDate: '2025-08-20', yearBuilt: 1999, description: 'Expired — limited showing availability hurt interest. Seller relocating, may relist at lower price.' },
  { address: '2600 Sandstone Dr', price: 725000, bedrooms: 5, bathrooms: 4, sqft: 3500, status: 'Expired', propertyType: 'single_family', neighborhood: 'Sandstone Ridge', listedDate: '2025-05-10', yearBuilt: 2002, description: 'Expired — luxury listing that sat 180+ days. Needs price adjustment per market analysis.' },
  { address: '190 Cherry Blossom Ct', price: 345000, bedrooms: 3, bathrooms: 2, sqft: 1650, status: 'Expired', propertyType: 'single_family', neighborhood: 'Cherry Blossom', listedDate: '2025-09-01', yearBuilt: 1987, description: 'Withdrawn — owner undecided. Home needs cosmetic updates; considering FSBO.' },
];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  const mapping: Record<string, string> = {
    'Active': 'Active Listings',
    'Pending': 'Pending',
    'Sold': 'Sold',
    'Expired': 'Expired / Withdrawn',
  };
  return groups[mapping[status] || 'Active Listings'];
}

export async function seedProperties(
  ctx: UrbanNestContext,
  board: BoardContext
): Promise<void> {
  console.log(`[UrbanNest] Seeding ${PROPERTIES.length} property listings...`);

  const agents = ctx.agentIds;

  for (let i = 0; i < PROPERTIES.length; i++) {
    const p = PROPERTIES[i];
    const groupId = getGroupForStatus(p.status, board.groups);

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: p.address,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Address'], value: p.address },
      { itemId: item.id, columnId: board.columns['Price'], value: p.price },
      { itemId: item.id, columnId: board.columns['Bedrooms'], value: p.bedrooms },
      { itemId: item.id, columnId: board.columns['Bathrooms'], value: p.bathrooms },
      { itemId: item.id, columnId: board.columns['Sq Ft'], value: p.sqft },
      { itemId: item.id, columnId: board.columns['Status'], value: p.status },
      { itemId: item.id, columnId: board.columns['Property Type'], value: p.propertyType },
      { itemId: item.id, columnId: board.columns['Neighborhood'], value: p.neighborhood },
      { itemId: item.id, columnId: board.columns['Listed Date'], value: p.listedDate },
      { itemId: item.id, columnId: board.columns['Listing Agent'], value: agents[i % agents.length] },
      { itemId: item.id, columnId: board.columns['Year Built'], value: p.yearBuilt },
      { itemId: item.id, columnId: board.columns['Description'], value: p.description },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[UrbanNest] Seeded ${PROPERTIES.length} properties across ${Object.keys(board.groups).length} groups`);
}

export { PROPERTIES };
