import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { UrbanNestContext } from './workspace';
import { BoardContext } from './boards';

interface LeadRecord {
  name: string;
  status: string;
  leadType: string;
  propertyInterest: string;
  budget: number;
  email: string;
  phone: string;
  lastContact: string;
  source: string;
  notes: string;
}

const LEADS: LeadRecord[] = [
  // ─── New Leads (20) ────────────────────────────────────────────────────
  { name: 'Jennifer Walsh', status: 'New', leadType: 'buyer', propertyInterest: '3BR single family in Oakwood Heights', budget: 450000, email: 'jwalsh@email.com', phone: '(555) 201-3344', lastContact: '2026-03-30', source: 'zillow', notes: 'Inquired about 742 Oakwood Dr listing. Relocating from out of state.' },
  { name: 'Robert & Lisa Chang', status: 'New', leadType: 'buyer', propertyInterest: 'Waterfront condo, 2BR minimum', budget: 550000, email: 'rchang@email.com', phone: '(555) 202-4455', lastContact: '2026-03-29', source: 'realtor', notes: 'Looking for vacation/investment property near harbor area.' },
  { name: 'Michael Torres', status: 'New', leadType: 'seller', propertyInterest: 'Selling 4BR colonial in Maplewood', budget: 380000, email: 'mtorres@email.com', phone: '(555) 203-5566', lastContact: '2026-03-31', source: 'referral', notes: 'Referred by past client. Looking to downsize after kids left for college.' },
  { name: 'Aisha Rahman', status: 'New', leadType: 'buyer', propertyInterest: 'Modern condo downtown, walkable', budget: 350000, email: 'arahman@email.com', phone: '(555) 204-6677', lastContact: '2026-03-28', source: 'website', notes: 'Young professional, first-time buyer. Interested in downtown condos.' },
  { name: 'Daniel & Sophia Kline', status: 'New', leadType: 'buyer', propertyInterest: '5BR in top school district', budget: 650000, email: 'dkline@email.com', phone: '(555) 205-7788', lastContact: '2026-04-01', source: 'open_house', notes: 'Attended open house at Birch Hill. Three kids, school district is top priority.' },
  { name: 'Patricia Nguyen', status: 'New', leadType: 'renter', propertyInterest: '1-2BR rental in Lakeside area', budget: 2200, email: 'pnguyen@email.com', phone: '(555) 206-8899', lastContact: '2026-03-27', source: 'social', notes: 'Graduate student looking for short-term rental, 12-month lease preferred.' },
  { name: 'James Whitfield', status: 'New', leadType: 'seller', propertyInterest: 'Selling townhouse in Cobblestone', budget: 390000, email: 'jwhitfield@email.com', phone: '(555) 207-9900', lastContact: '2026-04-01', source: 'cold_call', notes: 'Cold call lead — expressed mild interest, wants CMA before committing.' },
  { name: 'Carla Mendez', status: 'New', leadType: 'buyer', propertyInterest: 'Affordable starter home under $300k', budget: 290000, email: 'cmendez@email.com', phone: '(555) 208-1122', lastContact: '2026-03-26', source: 'zillow', notes: 'First-time buyer, pre-approved. Wants to move within 60 days.' },
  { name: 'Kevin & Amy Larson', status: 'New', leadType: 'both', propertyInterest: 'Sell 3BR ranch, buy 4BR with yard', budget: 500000, email: 'klarson@email.com', phone: '(555) 209-2233', lastContact: '2026-03-30', source: 'referral', notes: 'Growing family needs more space. Want to sell first, then buy.' },
  { name: 'Priya Desai', status: 'New', leadType: 'buyer', propertyInterest: 'Investment property, multi-family', budget: 450000, email: 'pdesai@email.com', phone: '(555) 210-3344', lastContact: '2026-04-02', source: 'website', notes: 'Real estate investor looking for rental income properties.' },
  { name: 'Thomas Reed', status: 'New', leadType: 'buyer', propertyInterest: 'Luxury home with pool, 4+ BR', budget: 800000, email: 'treed@email.com', phone: '(555) 211-4455', lastContact: '2026-03-25', source: 'realtor', notes: 'Corporate exec relocating. Needs a home within 45 days.' },
  { name: 'Nina Volkov', status: 'New', leadType: 'renter', propertyInterest: '2BR pet-friendly apartment', budget: 1800, email: 'nvolkov@email.com', phone: '(555) 212-5566', lastContact: '2026-03-29', source: 'social', notes: 'Has two small dogs. Flexible on location, firm on pet policy.' },
  { name: 'George Papadopoulos', status: 'New', leadType: 'seller', propertyInterest: 'Selling lakefront property', budget: 520000, email: 'gpapadopoulos@email.com', phone: '(555) 213-6677', lastContact: '2026-03-28', source: 'open_house', notes: 'Met at community event. Has waterfront lot, considering selling.' },
  { name: 'Sandra Liu', status: 'New', leadType: 'buyer', propertyInterest: 'Condo near transit, low HOA', budget: 280000, email: 'sliu@email.com', phone: '(555) 214-7788', lastContact: '2026-04-01', source: 'zillow', notes: 'Commuter wants easy rail access. Keeping HOA under $300/month.' },
  { name: 'Marcus & Tanya Brooks', status: 'New', leadType: 'buyer', propertyInterest: '3BR with home office space', budget: 420000, email: 'mbrooks@email.com', phone: '(555) 215-8899', lastContact: '2026-03-31', source: 'website', notes: 'Both work remote. Dedicated office and fast internet are must-haves.' },
  { name: 'Elena Vasquez', status: 'New', leadType: 'buyer', propertyInterest: 'New construction, energy efficient', budget: 475000, email: 'evasquez@email.com', phone: '(555) 216-9900', lastContact: '2026-03-27', source: 'realtor', notes: 'Values energy efficiency, solar panels, and modern insulation.' },
  { name: 'Henry Blackwell', status: 'New', leadType: 'seller', propertyInterest: 'Selling estate home in Grand Oaks', budget: 700000, email: 'hblackwell@email.com', phone: '(555) 217-1122', lastContact: '2026-03-30', source: 'referral', notes: 'Inherited property, wants to sell quickly. Estate sale considerations.' },
  { name: 'Fatima Al-Rashid', status: 'New', leadType: 'buyer', propertyInterest: '4BR near cultural center/mosque', budget: 400000, email: 'falrashid@email.com', phone: '(555) 218-2233', lastContact: '2026-04-02', source: 'cold_call', notes: 'Community proximity important. Open to various neighborhoods.' },
  { name: 'Chris & Dawn Baker', status: 'New', leadType: 'both', propertyInterest: 'Sell condo, buy single family', budget: 380000, email: 'cbaker@email.com', phone: '(555) 219-3344', lastContact: '2026-03-26', source: 'open_house', notes: 'Outgrowing their 2BR condo. Want more yard space for kids.' },
  { name: 'Yuki Tanaka', status: 'New', leadType: 'buyer', propertyInterest: 'Townhouse with garage, quiet area', budget: 360000, email: 'ytanaka@email.com', phone: '(555) 220-4455', lastContact: '2026-03-28', source: 'zillow', notes: 'Nurse, works night shifts — quiet neighborhood is critical.' },

  // ─── Contacted (18) ────────────────────────────────────────────────────
  { name: 'Brian Cooper', status: 'Contacted', leadType: 'buyer', propertyInterest: '4BR colonial, Cedar Ridge area', budget: 525000, email: 'bcooper@email.com', phone: '(555) 301-1100', lastContact: '2026-03-24', source: 'zillow', notes: 'Called back after inquiry. Wants to tour 3 properties this weekend.' },
  { name: 'Maria Gonzalez', status: 'Contacted', leadType: 'seller', propertyInterest: 'Selling 3BR in Elmwood Park', budget: 310000, email: 'mgonzalez@email.com', phone: '(555) 302-2200', lastContact: '2026-03-22', source: 'referral', notes: 'CMA sent. Home needs minor updates. Listing appointment scheduled.' },
  { name: 'David & Rachel Kim', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Family home near schools', budget: 480000, email: 'dkim@email.com', phone: '(555) 303-3300', lastContact: '2026-03-20', source: 'open_house', notes: 'Met at Ashford open house. Two young kids, prioritizing school ratings.' },
  { name: 'Stephanie Moore', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Luxury condo with amenities', budget: 500000, email: 'smoore@email.com', phone: '(555) 304-4400', lastContact: '2026-03-23', source: 'website', notes: 'Attorney, wants high-end finishes and concierge building.' },
  { name: 'Anthony DiMaggio', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Fixer-upper, good bones', budget: 250000, email: 'adimaggio@email.com', phone: '(555) 305-5500', lastContact: '2026-03-21', source: 'realtor', notes: 'Experienced renovator. Looking for below-market properties to flip.' },
  { name: 'Linda & Robert Hayes', status: 'Contacted', leadType: 'seller', propertyInterest: 'Downsizing from 5BR', budget: 600000, email: 'lhayes@email.com', phone: '(555) 306-6600', lastContact: '2026-03-19', source: 'cold_call', notes: 'Empty nesters. Want to sell large home and move to a 2BR condo.' },
  { name: 'Jason Park', status: 'Contacted', leadType: 'buyer', propertyInterest: '3BR near tech park', budget: 410000, email: 'jpark@email.com', phone: '(555) 307-7700', lastContact: '2026-03-25', source: 'social', notes: 'Software engineer. Short commute to tech corridor is priority.' },
  { name: 'Rebecca Foster', status: 'Contacted', leadType: 'renter', propertyInterest: 'Short-term furnished rental', budget: 3000, email: 'rfoster@email.com', phone: '(555) 308-8800', lastContact: '2026-03-18', source: 'website', notes: 'Traveling nurse, needs 3-6 month furnished rental.' },
  { name: 'Omar Sayed', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Condo investment, high rental yield', budget: 300000, email: 'osayed@email.com', phone: '(555) 309-9900', lastContact: '2026-03-22', source: 'referral', notes: 'Looking for cash-flow positive investment. Has 2 other rental units.' },
  { name: 'Catherine Bell', status: 'Contacted', leadType: 'buyer', propertyInterest: '3BR ranch, single story only', budget: 370000, email: 'cbell@email.com', phone: '(555) 310-1010', lastContact: '2026-03-20', source: 'realtor', notes: 'Mobility concerns — must be single story. Prefers ranch layouts.' },
  { name: 'Trevor & Mia Washington', status: 'Contacted', leadType: 'buyer', propertyInterest: 'New build with warranty', budget: 550000, email: 'twashington@email.com', phone: '(555) 311-2020', lastContact: '2026-03-24', source: 'open_house', notes: 'Want brand-new construction with builder warranty. No older homes.' },
  { name: 'Hannah Pearson', status: 'Contacted', leadType: 'seller', propertyInterest: 'Selling inherited condo', budget: 270000, email: 'hpearson@email.com', phone: '(555) 312-3030', lastContact: '2026-03-17', source: 'zillow', notes: 'Inherited condo from grandmother. Lives out of state, wants quick sale.' },
  { name: 'Victor Romero', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Acreage property, 1+ acres', budget: 475000, email: 'vromero@email.com', phone: '(555) 313-4040', lastContact: '2026-03-23', source: 'cold_call', notes: 'Hobby farmer, wants space for chickens and small garden.' },
  { name: 'Emily Chen', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Townhouse near hospital', budget: 390000, email: 'echen@email.com', phone: '(555) 314-5050', lastContact: '2026-03-21', source: 'website', notes: 'Resident physician, needs to be within 15 min of regional hospital.' },
  { name: 'Douglas & Fiona Scott', status: 'Contacted', leadType: 'both', propertyInterest: 'Sell townhouse, buy detached', budget: 450000, email: 'dscott@email.com', phone: '(555) 315-6060', lastContact: '2026-03-19', source: 'referral', notes: 'Want detached home with yard. Currently in townhouse, need to coordinate timing.' },
  { name: 'Ashley Morgan', status: 'Contacted', leadType: 'buyer', propertyInterest: 'Eco-friendly home, solar ready', budget: 500000, email: 'amorgan@email.com', phone: '(555) 316-7070', lastContact: '2026-03-25', source: 'social', notes: 'Environmental scientist. Wants LEED or Energy Star certified homes.' },
  { name: 'Ryan O\'Brien', status: 'Contacted', leadType: 'buyer', propertyInterest: '2BR with home gym space', budget: 320000, email: 'robrien@email.com', phone: '(555) 317-8080', lastContact: '2026-03-22', source: 'zillow', notes: 'Personal trainer. Basement or garage gym space is a dealbreaker.' },
  { name: 'Natasha Petrov', status: 'Contacted', leadType: 'seller', propertyInterest: 'Selling waterfront home', budget: 680000, email: 'npetrov@email.com', phone: '(555) 318-9090', lastContact: '2026-03-18', source: 'referral', notes: 'Beautiful waterfront property. Relocating to Europe, motivated seller.' },

  // ─── Showing Scheduled (15) ────────────────────────────────────────────
  { name: 'Paul & Janet Rivera', status: 'Showing', leadType: 'buyer', propertyInterest: '4BR near Sunrise Hills', budget: 470000, email: 'privera@email.com', phone: '(555) 401-1100', lastContact: '2026-03-28', source: 'open_house', notes: 'Showing scheduled for 742 Oakwood Dr and 310 Sunrise Terrace.' },
  { name: 'Michelle Lee', status: 'Showing', leadType: 'buyer', propertyInterest: 'Luxury condo with harbor views', budget: 540000, email: 'mlee@email.com', phone: '(555) 402-2200', lastContact: '2026-03-26', source: 'realtor', notes: 'Touring Harbor Point condos this Saturday. Pre-approved at $550k.' },
  { name: 'Derek & Susan Grant', status: 'Showing', leadType: 'buyer', propertyInterest: '5BR executive home', budget: 750000, email: 'dgrant@email.com', phone: '(555) 403-3300', lastContact: '2026-03-27', source: 'referral', notes: 'VP relocating from Chicago. Needs large home with home office.' },
  { name: 'Laura Bennett', status: 'Showing', leadType: 'buyer', propertyInterest: '3BR in Willow Creek area', budget: 400000, email: 'lbennett@email.com', phone: '(555) 404-4400', lastContact: '2026-03-25', source: 'zillow', notes: 'Showing Willow Creek townhouses. Loves the community vibe.' },
  { name: 'Ahmad Hassan', status: 'Showing', leadType: 'buyer', propertyInterest: 'Family home, 4BR, good schools', budget: 490000, email: 'ahassan@email.com', phone: '(555) 405-5500', lastContact: '2026-03-29', source: 'website', notes: 'Three showings booked in Fieldstone and Heritage Hills.' },
  { name: 'Samantha Wright', status: 'Showing', leadType: 'buyer', propertyInterest: 'Downtown loft or studio+', budget: 300000, email: 'swright@email.com', phone: '(555) 406-6600', lastContact: '2026-03-24', source: 'social', notes: 'Showing downtown condos next week. Prefers modern aesthetic.' },
  { name: 'Gregory & Helen Novak', status: 'Showing', leadType: 'buyer', propertyInterest: 'Ranch on large lot', budget: 460000, email: 'gnovak@email.com', phone: '(555) 407-7700', lastContact: '2026-03-28', source: 'open_house', notes: 'Retired couple looking to garden. Need single-story with large yard.' },
  { name: 'Victoria Simmons', status: 'Showing', leadType: 'buyer', propertyInterest: 'Townhouse with rooftop', budget: 430000, email: 'vsimmons@email.com', phone: '(555) 408-8800', lastContact: '2026-03-26', source: 'realtor', notes: 'Loves outdoor entertaining. Rooftop deck or large patio required.' },
  { name: 'Nathan & Brittany Cole', status: 'Showing', leadType: 'buyer', propertyInterest: '4BR near Cypress Creek', budget: 520000, email: 'ncole@email.com', phone: '(555) 409-9900', lastContact: '2026-03-27', source: 'zillow', notes: 'Touring 3 properties in Cypress Creek area. Have young twins.' },
  { name: 'Jessica Okafor', status: 'Showing', leadType: 'buyer', propertyInterest: 'Condo with mountain views', budget: 320000, email: 'jokafor@email.com', phone: '(555) 410-1010', lastContact: '2026-03-25', source: 'website', notes: 'Showing scheduled at Sycamore and Ivy Park condos.' },
  { name: 'Raymond & Carol Dunn', status: 'Showing', leadType: 'buyer', propertyInterest: 'Coastal townhome', budget: 440000, email: 'rdunn@email.com', phone: '(555) 411-2020', lastContact: '2026-03-29', source: 'open_house', notes: 'Interested in Seaside townhomes. Weekend showing arranged.' },
  { name: 'Andrew Fischer', status: 'Showing', leadType: 'buyer', propertyInterest: '3BR with workshop/garage', budget: 410000, email: 'afischer@email.com', phone: '(555) 412-3030', lastContact: '2026-03-26', source: 'referral', notes: 'Woodworker needs large garage or workshop. Flexible on location.' },
  { name: 'Diana Christensen', status: 'Showing', leadType: 'buyer', propertyInterest: 'Contemporary home, open plan', budget: 580000, email: 'dchristensen@email.com', phone: '(555) 413-4040', lastContact: '2026-03-28', source: 'realtor', notes: 'Architect, very specific taste. Showing modern homes in Vista Grande.' },
  { name: 'Roger & Mei-Lin Huang', status: 'Showing', leadType: 'buyer', propertyInterest: 'Multi-generational home', budget: 620000, email: 'rhuang@email.com', phone: '(555) 414-5050', lastContact: '2026-03-30', source: 'zillow', notes: 'Need in-law suite for parents. Showing homes with separate entrance.' },
  { name: 'Kristin Palmer', status: 'Showing', leadType: 'buyer', propertyInterest: '2-3BR, pet-friendly community', budget: 350000, email: 'kpalmer@email.com', phone: '(555) 415-6060', lastContact: '2026-03-27', source: 'social', notes: 'Has golden retriever. Dog park proximity and no breed restrictions needed.' },

  // ─── Offer Stage (7) ───────────────────────────────────────────────────
  { name: 'Steven & Allison Park', status: 'Offer', leadType: 'buyer', propertyInterest: '1420 Cedar Ridge Way', budget: 540000, email: 'spark@email.com', phone: '(555) 501-1100', lastContact: '2026-03-29', source: 'open_house', notes: 'Submitted offer at $535k on Cedar Ridge property. Counter expected.' },
  { name: 'Margaret Johansson', status: 'Offer', leadType: 'buyer', propertyInterest: '300 Park Place #12A', budget: 420000, email: 'mjohansson@email.com', phone: '(555) 502-2200', lastContact: '2026-03-28', source: 'realtor', notes: 'Offered full asking price with 30-day close. Awaiting seller response.' },
  { name: 'Chris & Angela Reeves', status: 'Offer', leadType: 'buyer', propertyInterest: '1605 Ashford Glen', budget: 510000, email: 'creeves@email.com', phone: '(555) 503-3300', lastContact: '2026-03-30', source: 'referral', notes: 'Competing offer situation. Offered $505k with escalation clause to $520k.' },
  { name: 'William Foster', status: 'Offer', leadType: 'buyer', propertyInterest: '820 Aspen Ct', budget: 440000, email: 'wfoster@email.com', phone: '(555) 504-4400', lastContact: '2026-03-27', source: 'zillow', notes: 'Cash offer at $425k. Seller considering, wants higher price.' },
  { name: 'Sarah & Tom Brennan', status: 'Offer', leadType: 'buyer', propertyInterest: '501 Fieldstone Dr', budget: 485000, email: 'sbrennan@email.com', phone: '(555) 505-5500', lastContact: '2026-03-31', source: 'website', notes: 'Offer accepted pending inspection. Closing targeted for April 30.' },
  { name: 'Alicia Moreno', status: 'Offer', leadType: 'buyer', propertyInterest: '2330 Dune Way', budget: 430000, email: 'amoreno@email.com', phone: '(555) 506-6600', lastContact: '2026-03-29', source: 'open_house', notes: 'Second showing sealed the deal. Offered $420k, negotiations in progress.' },
  { name: 'Peter & Diane Young', status: 'Offer', leadType: 'buyer', propertyInterest: '88 Laurel Heights Rd', budget: 610000, email: 'pyoung@email.com', phone: '(555) 507-7700', lastContact: '2026-03-30', source: 'referral', notes: 'Offered $595k. Seller countered at $605k. Final negotiations underway.' },

  // ─── Closing / Under Contract (5) ──────────────────────────────────────
  { name: 'Kenneth & Joyce Miller', status: 'Closing', leadType: 'buyer', propertyInterest: '930 Rosewood Ln', budget: 415000, email: 'kmiller@email.com', phone: '(555) 601-1100', lastContact: '2026-03-25', source: 'zillow', notes: 'Under contract at $412k. Inspection passed. Appraisal scheduled April 5.' },
  { name: 'Nicole Anderson', status: 'Closing', leadType: 'buyer', propertyInterest: '410 Spring Garden Way #6D', budget: 260000, email: 'nanderson@email.com', phone: '(555) 602-2200', lastContact: '2026-03-22', source: 'website', notes: 'Closing April 15. Title clear, mortgage docs in underwriting.' },
  { name: 'Benjamin & Ruth Torres', status: 'Closing', leadType: 'buyer', propertyInterest: '85 Stone Bridge Rd', budget: 495000, email: 'btorres@email.com', phone: '(555) 603-3300', lastContact: '2026-03-28', source: 'referral', notes: 'Final walkthrough scheduled April 8. Closing April 10.' },
  { name: 'Amanda Chen-Park', status: 'Closing', leadType: 'buyer', propertyInterest: '1680 Falcon Crest Dr', budget: 575000, email: 'achenpark@email.com', phone: '(555) 604-4400', lastContact: '2026-03-26', source: 'realtor', notes: 'Mortgage approved. Closing documents being prepared. Target: April 12.' },
  { name: 'Frank & Maria Schultz', status: 'Closing', leadType: 'buyer', propertyInterest: '60 Meadow Glen Ct', budget: 525000, email: 'fschultz@email.com', phone: '(555) 605-5500', lastContact: '2026-03-30', source: 'open_house', notes: 'Closing next week. Moving truck booked. All contingencies cleared.' },

  // ─── Closed (15) ───────────────────────────────────────────────────────
  { name: 'Timothy & Sarah Wright', status: 'Closed', leadType: 'buyer', propertyInterest: '740 Brookside Ave', budget: 410000, email: 'twright@email.com', phone: '(555) 701-1100', lastContact: '2026-02-15', source: 'zillow', notes: 'Closed at $405k on Feb 15. Happy clients, promised referrals.' },
  { name: 'Rachel Green', status: 'Closed', leadType: 'buyer', propertyInterest: '2100 Summit View #3F', budget: 300000, email: 'rgreen@email.com', phone: '(555) 702-2200', lastContact: '2026-01-20', source: 'website', notes: 'Closed at $298k. First-time buyer, gifted closing costs.' },
  { name: 'Alex & Jordan Rivera', status: 'Closed', leadType: 'buyer', propertyInterest: '1325 Winding Creek Path', budget: 540000, email: 'arivera@email.com', phone: '(555) 703-3300', lastContact: '2026-01-10', source: 'referral', notes: 'Closed at $535k. Relocated from Denver. Very smooth transaction.' },
  { name: 'Diane Blackwood', status: 'Closed', leadType: 'buyer', propertyInterest: '48 Garden Gate Way', budget: 370000, email: 'dblackwood@email.com', phone: '(555) 704-4400', lastContact: '2026-02-01', source: 'open_house', notes: 'Closed at $365k. Downsizer, loves the low-maintenance lifestyle.' },
  { name: 'Martin & Gloria Cheng', status: 'Closed', leadType: 'buyer', propertyInterest: '3500 Oceanfront Dr', budget: 950000, email: 'mcheng@email.com', phone: '(555) 705-5500', lastContact: '2025-12-20', source: 'realtor', notes: 'Closed at $925k. Highest commission deal this quarter. Luxury market.' },
  { name: 'Sharon Wells', status: 'Closed', leadType: 'buyer', propertyInterest: '615 Magnolia Crossing', budget: 320000, email: 'swells@email.com', phone: '(555) 706-6600', lastContact: '2026-01-15', source: 'zillow', notes: 'Closed at $315k. Single mom, FHA loan. Extremely grateful.' },
  { name: 'Patrick & Laura O\'Connell', status: 'Closed', leadType: 'buyer', propertyInterest: '1800 Cliffside Terrace', budget: 490000, email: 'poconnell@email.com', phone: '(555) 707-7700', lastContact: '2026-01-25', source: 'referral', notes: 'Closed at $480k. Love the view. Already recommended us to neighbors.' },
  { name: 'Jason Yamamoto', status: 'Closed', leadType: 'buyer', propertyInterest: '250 Lakeview Plaza #14B', budget: 275000, email: 'jyamamoto@email.com', phone: '(555) 708-8800', lastContact: '2026-02-10', source: 'website', notes: 'Closed at $269k. Investment purchase, plans to rent immediately.' },
  { name: 'Lisa & Craig Morrison', status: 'Closed', leadType: 'buyer', propertyInterest: '905 Thornberry Ln', budget: 450000, email: 'lmorrison@email.com', phone: '(555) 709-9900', lastContact: '2026-02-20', source: 'open_house', notes: 'Closed at $445k. Young family, fourth child on the way. Needed the space.' },
  { name: 'Roberto Fernandez', status: 'Closed', leadType: 'buyer', propertyInterest: '1450 Silverbell Way', budget: 515000, email: 'rfernandez@email.com', phone: '(555) 710-1010', lastContact: '2026-01-30', source: 'realtor', notes: 'Closed at $510k. Loved the modern farmhouse style. Smooth close.' },
  { name: 'Ann & David Whitman', status: 'Closed', leadType: 'seller', propertyInterest: 'Sold home in Brookside', budget: 405000, email: 'awhitman@email.com', phone: '(555) 711-2020', lastContact: '2026-02-15', source: 'referral', notes: 'Listed and sold in 12 days. Above asking price. Great testimonial.' },
  { name: 'Howard Stein', status: 'Closed', leadType: 'seller', propertyInterest: 'Sold lakefront condo', budget: 269000, email: 'hstein@email.com', phone: '(555) 712-3030', lastContact: '2026-02-10', source: 'cold_call', notes: 'Estate sale, handled sensitively. Sold at asking. Executor very pleased.' },
  { name: 'Sandra & Mark Phillips', status: 'Closed', leadType: 'seller', propertyInterest: 'Sold in Winding Creek', budget: 535000, email: 'sphillips@email.com', phone: '(555) 713-4040', lastContact: '2026-01-10', source: 'referral', notes: 'Relocated to Florida. Sold in 21 days. Used UrbanNest for buying too.' },
  { name: 'Tiffany Brooks', status: 'Closed', leadType: 'seller', propertyInterest: 'Sold townhouse in Garden Gate', budget: 365000, email: 'tbrooks@email.com', phone: '(555) 714-5050', lastContact: '2026-02-01', source: 'website', notes: 'Upgraded to single family. Sold townhome at full price with multiple offers.' },
  { name: 'Carlos & Elena Ruiz', status: 'Closed', leadType: 'both', propertyInterest: 'Sold & bought in Cliffside', budget: 480000, email: 'cruiz@email.com', phone: '(555) 715-6060', lastContact: '2026-01-25', source: 'referral', notes: 'Dual transaction — sold old home and bought Cliffside property. Both went smoothly.' },
];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  const mapping: Record<string, string> = {
    'New': 'New Leads',
    'Contacted': 'Contacted',
    'Showing': 'Showing Scheduled',
    'Offer': 'Offer Stage',
    'Closing': 'Under Contract',
    'Closed': 'Closed',
  };
  return groups[mapping[status] || 'New Leads'];
}

export async function seedLeads(
  ctx: UrbanNestContext,
  board: BoardContext
): Promise<void> {
  console.log(`[UrbanNest] Seeding ${LEADS.length} leads...`);

  const agents = ctx.agentIds;

  for (let i = 0; i < LEADS.length; i++) {
    const lead = LEADS[i];
    const groupId = getGroupForStatus(lead.status, board.groups);

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: lead.name,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Status'], value: lead.status },
      { itemId: item.id, columnId: board.columns['Lead Type'], value: lead.leadType },
      { itemId: item.id, columnId: board.columns['Property Interest'], value: lead.propertyInterest },
      { itemId: item.id, columnId: board.columns['Budget'], value: lead.budget },
      { itemId: item.id, columnId: board.columns['Contact Email'], value: lead.email },
      { itemId: item.id, columnId: board.columns['Contact Phone'], value: lead.phone },
      { itemId: item.id, columnId: board.columns['Last Contact'], value: lead.lastContact },
      { itemId: item.id, columnId: board.columns['Agent'], value: agents[i % agents.length] },
      { itemId: item.id, columnId: board.columns['Source'], value: lead.source },
      { itemId: item.id, columnId: board.columns['Notes'], value: lead.notes },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[UrbanNest] Seeded ${LEADS.length} leads (including 15 closed deals)`);
}

export { LEADS };
