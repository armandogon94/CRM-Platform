import { Item, ColumnValue } from '../../models';
import { NovaPayContext } from './workspace';
import { BoardContext } from './boards';

interface MerchantRecord {
  name: string;
  company: string;
  industry: string;
  status: string;
  risk: string;
  notes: string;
  monthlyVolume: number;
  email: string;
  setupDate: string;
}

// 20 E-Commerce merchants
const ECOMMERCE: MerchantRecord[] = [
  { name: 'ShopWave Inc', company: 'ShopWave Inc', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Established D2C brand, clean transaction history', monthlyVolume: 245000, email: 'billing@shopwave.com', setupDate: '2025-03-15' },
  { name: 'LuxeCart', company: 'LuxeCart LLC', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Premium fashion retailer, high AOV', monthlyVolume: 520000, email: 'payments@luxecart.com', setupDate: '2025-01-22' },
  { name: 'GadgetVault', company: 'GadgetVault Corp', industry: 'ecommerce', status: 'API Active', risk: 'medium', notes: 'Electronics retailer, occasional chargeback spikes during holiday season', monthlyVolume: 890000, email: 'finance@gadgetvault.com', setupDate: '2024-11-08' },
  { name: 'PetPalace Online', company: 'PetPalace LLC', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Pet supplies subscription model, low dispute rate', monthlyVolume: 175000, email: 'accounts@petpalace.co', setupDate: '2025-06-01' },
  { name: 'FreshThreads', company: 'FreshThreads Inc', industry: 'ecommerce', status: 'KYC Verified', risk: 'low', notes: 'Sustainable fashion brand, pending final contract review', monthlyVolume: 310000, email: 'ops@freshthreads.com', setupDate: '2026-02-10' },
  { name: 'BookNest', company: 'BookNest Media', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Online bookstore with digital + physical inventory', monthlyVolume: 85000, email: 'pay@booknest.io', setupDate: '2025-04-18' },
  { name: 'HomeHaven', company: 'HomeHaven Decor', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Home furnishing, reliable payment patterns', monthlyVolume: 420000, email: 'ar@homehaven.com', setupDate: '2024-09-30' },
  { name: 'VitaBoost', company: 'VitaBoost Health', industry: 'ecommerce', status: 'API Active', risk: 'medium', notes: 'Supplement e-store, monitor for subscription chargeback patterns', monthlyVolume: 195000, email: 'billing@vitaboost.co', setupDate: '2025-07-12' },
  { name: 'PixelPrint Studio', company: 'PixelPrint LLC', industry: 'ecommerce', status: 'Contract Signed', risk: 'low', notes: 'Custom print-on-demand service', monthlyVolume: 65000, email: 'finance@pixelprint.co', setupDate: '2026-03-01' },
  { name: 'ToyTrove', company: 'ToyTrove Inc', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Children toy retailer, seasonal volume spikes in Q4', monthlyVolume: 340000, email: 'ap@toytrove.com', setupDate: '2025-02-28' },
  { name: 'GreenGrocer Direct', company: 'GreenGrocer LLC', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Organic grocery delivery, high retention', monthlyVolume: 155000, email: 'payments@greengrocer.co', setupDate: '2025-08-20' },
  { name: 'StyleVerse', company: 'StyleVerse Fashion', industry: 'ecommerce', status: 'API Active', risk: 'medium', notes: 'Fast fashion marketplace, higher-than-average return rate', monthlyVolume: 780000, email: 'finance@styleverse.com', setupDate: '2024-12-15' },
  { name: 'TechDirect', company: 'TechDirect Solutions', industry: 'ecommerce', status: 'KYC In Progress', risk: 'medium', notes: 'B2B electronics supplier, large order values', monthlyVolume: 1250000, email: 'accounts@techdirect.biz', setupDate: '2026-03-15' },
  { name: 'ArtisanAlley', company: 'ArtisanAlley Marketplace', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Handmade goods marketplace, multiple seller payouts', monthlyVolume: 290000, email: 'payments@artisanalley.com', setupDate: '2025-05-10' },
  { name: 'SneakerDrop', company: 'SneakerDrop LLC', industry: 'ecommerce', status: 'API Active', risk: 'high', notes: 'Limited edition sneaker resale, elevated fraud risk in resale market', monthlyVolume: 680000, email: 'ops@sneakerdrop.io', setupDate: '2025-09-05' },
  { name: 'CleanHome Co', company: 'CleanHome Products', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Eco cleaning supplies, subscription-heavy model', monthlyVolume: 110000, email: 'billing@cleanhome.co', setupDate: '2025-10-18' },
  { name: 'WineSelect', company: 'WineSelect Inc', industry: 'ecommerce', status: 'API Active', risk: 'medium', notes: 'Wine subscription service, age verification required', monthlyVolume: 205000, email: 'finance@wineselect.com', setupDate: '2025-04-01' },
  { name: 'FitGear Pro', company: 'FitGear Pro LLC', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Fitness equipment D2C, seasonal Q1 spike', monthlyVolume: 370000, email: 'pay@fitgearpro.com', setupDate: '2024-10-22' },
  { name: 'BabyBloom', company: 'BabyBloom Essentials', industry: 'ecommerce', status: 'Submitted', risk: 'low', notes: 'New applicant — baby products retailer, awaiting document review', monthlyVolume: 95000, email: 'hello@babybloom.co', setupDate: '2026-03-28' },
  { name: 'OutdoorEdge', company: 'OutdoorEdge Gear', industry: 'ecommerce', status: 'API Active', risk: 'low', notes: 'Camping and hiking equipment, steady growth', monthlyVolume: 230000, email: 'accounts@outdooredge.com', setupDate: '2025-06-14' },
];

// 18 Retail merchants
const RETAIL: MerchantRecord[] = [
  { name: 'Metro Mart', company: 'Metro Mart Stores', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Regional grocery chain, 12 locations', monthlyVolume: 1850000, email: 'treasury@metromart.com', setupDate: '2024-06-20' },
  { name: 'UrbanWear', company: 'UrbanWear Boutique', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Fashion boutique chain, 5 stores', monthlyVolume: 320000, email: 'finance@urbanwear.com', setupDate: '2025-01-10' },
  { name: 'QuickStop Convenience', company: 'QuickStop LLC', industry: 'retail', status: 'API Active', risk: 'low', notes: '24/7 convenience chain, high transaction count', monthlyVolume: 560000, email: 'billing@quickstop.co', setupDate: '2024-08-15' },
  { name: 'GreenLeaf Pharmacy', company: 'GreenLeaf Health', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Independent pharmacy group, 3 locations', monthlyVolume: 420000, email: 'accounts@greenleafrx.com', setupDate: '2025-03-22' },
  { name: 'AutoParts Plus', company: 'AutoParts Plus Inc', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Automotive parts retailer, B2B + B2C mix', monthlyVolume: 680000, email: 'ap@autopartsplus.com', setupDate: '2024-11-30' },
  { name: 'Bloom Florals', company: 'Bloom Floral Studio', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Premium florist, event and daily delivery', monthlyVolume: 75000, email: 'orders@bloomflorals.com', setupDate: '2025-07-08' },
  { name: 'SportZone', company: 'SportZone Athletics', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Sporting goods chain, 8 locations', monthlyVolume: 950000, email: 'finance@sportzone.com', setupDate: '2024-09-12' },
  { name: 'BrightSmile Dental Supply', company: 'BrightSmile Corp', industry: 'retail', status: 'API Active', risk: 'low', notes: 'B2B dental supply distributor', monthlyVolume: 540000, email: 'ar@brightsmile.biz', setupDate: '2025-02-14' },
  { name: 'PawsNClaws', company: 'PawsNClaws Pet Store', industry: 'retail', status: 'KYC Verified', risk: 'low', notes: 'Pet store chain, expanding to 4th location', monthlyVolume: 210000, email: 'pay@pawsnclaws.com', setupDate: '2026-01-20' },
  { name: 'TileWorld', company: 'TileWorld Home', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Home improvement tile showroom', monthlyVolume: 385000, email: 'billing@tileworld.com', setupDate: '2025-05-30' },
  { name: 'Vintage Vinyl', company: 'Vintage Vinyl Records', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Record store + online hybrid, niche market', monthlyVolume: 45000, email: 'shop@vintagevinyl.co', setupDate: '2025-09-01' },
  { name: 'LuxeJewels', company: 'LuxeJewels Fine Jewelry', industry: 'retail', status: 'API Active', risk: 'medium', notes: 'High-value luxury items, enhanced fraud monitoring', monthlyVolume: 890000, email: 'finance@luxejewels.com', setupDate: '2024-07-25' },
  { name: 'FreshBake Market', company: 'FreshBake Inc', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Artisan bakery + cafe, 3 locations', monthlyVolume: 125000, email: 'pay@freshbake.co', setupDate: '2025-08-10' },
  { name: 'KidZone', company: 'KidZone Family Fun', industry: 'retail', status: 'Contract Signed', risk: 'low', notes: 'Indoor play center, party bookings', monthlyVolume: 95000, email: 'accounts@kidzone.fun', setupDate: '2026-02-28' },
  { name: 'EcoMart', company: 'EcoMart Sustainable Goods', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Zero-waste store, loyal customer base', monthlyVolume: 68000, email: 'billing@ecomart.co', setupDate: '2025-11-15' },
  { name: 'GoldenHarvest', company: 'GoldenHarvest Organics', industry: 'retail', status: 'API Active', risk: 'low', notes: 'Organic farm market, weekend farmers markets', monthlyVolume: 52000, email: 'pay@goldenharvest.farm', setupDate: '2025-04-22' },
  { name: 'TechHub Store', company: 'TechHub Retail', industry: 'retail', status: 'API Active', risk: 'medium', notes: 'Consumer electronics, extended warranty upsell', monthlyVolume: 1100000, email: 'finance@techhub.store', setupDate: '2024-10-05' },
  { name: 'CraftCorner', company: 'CraftCorner Supplies', industry: 'retail', status: 'Submitted', risk: 'low', notes: 'Arts and crafts supply store, new applicant', monthlyVolume: 82000, email: 'hello@craftcorner.co', setupDate: '2026-03-20' },
];

// 15 SaaS merchants
const SAAS: MerchantRecord[] = [
  { name: 'CloudSync Pro', company: 'CloudSync Software', industry: 'saas', status: 'API Active', risk: 'low', notes: 'B2B file sync platform, annual contracts', monthlyVolume: 420000, email: 'billing@cloudsync.io', setupDate: '2024-08-01' },
  { name: 'DataViz Labs', company: 'DataViz Labs Inc', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Business analytics dashboard SaaS', monthlyVolume: 310000, email: 'finance@datavizlabs.com', setupDate: '2025-01-15' },
  { name: 'TaskFlow', company: 'TaskFlow Inc', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Project management tool, strong MRR growth', monthlyVolume: 680000, email: 'ar@taskflow.app', setupDate: '2024-06-10' },
  { name: 'SecureAuth360', company: 'SecureAuth360 LLC', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Identity and access management platform', monthlyVolume: 540000, email: 'payments@secureauth360.com', setupDate: '2024-12-01' },
  { name: 'MailPulse', company: 'MailPulse Marketing', industry: 'saas', status: 'API Active', risk: 'medium', notes: 'Email marketing platform, monitor for bulk refund patterns', monthlyVolume: 290000, email: 'billing@mailpulse.io', setupDate: '2025-03-18' },
  { name: 'HRNexus', company: 'HRNexus Corp', industry: 'saas', status: 'API Active', risk: 'low', notes: 'HR management suite, enterprise contracts', monthlyVolume: 850000, email: 'finance@hrnexus.com', setupDate: '2024-09-22' },
  { name: 'ShipTrack', company: 'ShipTrack Solutions', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Logistics tracking SaaS, growing merchant base', monthlyVolume: 175000, email: 'pay@shiptrack.io', setupDate: '2025-05-05' },
  { name: 'ChatBot AI', company: 'ChatBot AI Inc', industry: 'saas', status: 'KYC Verified', risk: 'low', notes: 'Conversational AI platform, pending API integration', monthlyVolume: 230000, email: 'billing@chatbotai.dev', setupDate: '2026-01-30' },
  { name: 'InvoiceNinja', company: 'InvoiceNinja Software', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Invoicing and billing automation tool', monthlyVolume: 145000, email: 'support@invoiceninja.co', setupDate: '2025-06-20' },
  { name: 'FormStack Pro', company: 'FormStack Pro LLC', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Form builder and data collection platform', monthlyVolume: 195000, email: 'ar@formstackpro.com', setupDate: '2025-02-08' },
  { name: 'CodeDeploy', company: 'CodeDeploy DevOps', industry: 'saas', status: 'API Active', risk: 'low', notes: 'CI/CD and DevOps automation platform', monthlyVolume: 460000, email: 'billing@codedeploy.io', setupDate: '2024-11-15' },
  { name: 'LegalDocs AI', company: 'LegalDocs AI Corp', industry: 'saas', status: 'Contract Signed', risk: 'low', notes: 'AI-powered legal document generation', monthlyVolume: 120000, email: 'finance@legaldocsai.com', setupDate: '2026-02-15' },
  { name: 'SurveyHero', company: 'SurveyHero Inc', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Customer feedback and survey platform', monthlyVolume: 88000, email: 'pay@surveyhero.io', setupDate: '2025-07-28' },
  { name: 'ScheduleEase', company: 'ScheduleEase App', industry: 'saas', status: 'API Active', risk: 'low', notes: 'Appointment scheduling for service businesses', monthlyVolume: 165000, email: 'billing@scheduleease.com', setupDate: '2025-10-01' },
  { name: 'PixelForge', company: 'PixelForge Creative', industry: 'saas', status: 'Submitted', risk: 'low', notes: 'New applicant — design collaboration platform', monthlyVolume: 210000, email: 'hello@pixelforge.design', setupDate: '2026-03-25' },
];

// 12 Food Service merchants
const FOOD_SERVICE: MerchantRecord[] = [
  { name: 'Bella Cucina', company: 'Bella Cucina Restaurant Group', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Italian restaurant chain, 4 locations', monthlyVolume: 280000, email: 'pay@bellacucina.com', setupDate: '2025-01-05' },
  { name: 'Dragon Wok Express', company: 'Dragon Wok LLC', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Fast-casual Asian restaurant, 6 locations', monthlyVolume: 410000, email: 'billing@dragonwok.com', setupDate: '2024-10-18' },
  { name: 'Sunrise Bakery & Cafe', company: 'Sunrise Cafes Inc', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Bakery cafe chain, morning-heavy traffic', monthlyVolume: 190000, email: 'finance@sunrisecafe.co', setupDate: '2025-04-10' },
  { name: 'TacoFiesta', company: 'TacoFiesta Group', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Mexican fast-casual, delivery-heavy', monthlyVolume: 350000, email: 'ap@tacofiesta.com', setupDate: '2024-12-20' },
  { name: 'The Burger Barn', company: 'Burger Barn Inc', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Gourmet burger restaurant, 2 locations', monthlyVolume: 165000, email: 'pay@burgerbarn.co', setupDate: '2025-06-08' },
  { name: 'SeaBreeze Seafood', company: 'SeaBreeze Dining LLC', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Upscale seafood restaurant, high AOV', monthlyVolume: 225000, email: 'ar@seabreeze.restaurant', setupDate: '2025-02-25' },
  { name: 'GreenBowl Kitchen', company: 'GreenBowl Health Foods', industry: 'food_service', status: 'KYC Verified', risk: 'low', notes: 'Health-focused fast casual, 3rd location opening', monthlyVolume: 140000, email: 'billing@greenbowl.co', setupDate: '2026-01-12' },
  { name: 'PizzaForge', company: 'PizzaForge LLC', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Wood-fired pizza delivery, single location', monthlyVolume: 75000, email: 'orders@pizzaforge.com', setupDate: '2025-08-30' },
  { name: 'SipNBrew Coffee', company: 'SipNBrew Holdings', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Specialty coffee chain, 8 locations', monthlyVolume: 310000, email: 'finance@sipnbrew.co', setupDate: '2024-07-15' },
  { name: 'Noodle House', company: 'Noodle House Asian Dining', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Pan-Asian noodle bar, popular for delivery', monthlyVolume: 185000, email: 'pay@noodlehouse.com', setupDate: '2025-05-20' },
  { name: 'Smokehouse BBQ', company: 'Smokehouse BBQ Co', industry: 'food_service', status: 'Contract Signed', risk: 'low', notes: 'BBQ restaurant expanding, large catering orders', monthlyVolume: 120000, email: 'billing@smokehousebbq.com', setupDate: '2026-02-20' },
  { name: 'CrispLeaf Salads', company: 'CrispLeaf Inc', industry: 'food_service', status: 'API Active', risk: 'low', notes: 'Build-your-own salad chain, 5 locations', monthlyVolume: 215000, email: 'finance@crispleaf.co', setupDate: '2025-09-10' },
];

// 10 Other merchants (healthcare, travel, misc)
const OTHER: MerchantRecord[] = [
  { name: 'SwiftCab', company: 'SwiftCab Transportation', industry: 'travel', status: 'API Active', risk: 'medium', notes: 'Ride-hailing service, high transaction volume', monthlyVolume: 920000, email: 'payments@swiftcab.com', setupDate: '2024-08-28' },
  { name: 'WellnessFirst Spa', company: 'WellnessFirst LLC', industry: 'healthcare', status: 'API Active', risk: 'low', notes: 'Day spa and wellness center, 2 locations', monthlyVolume: 135000, email: 'billing@wellnessfirst.co', setupDate: '2025-03-12' },
  { name: 'TravelBee', company: 'TravelBee Vacations', industry: 'travel', status: 'API Active', risk: 'medium', notes: 'Online travel agency, higher chargeback risk for cancellations', monthlyVolume: 680000, email: 'finance@travelbee.com', setupDate: '2024-11-20' },
  { name: 'ParkEase', company: 'ParkEase Parking', industry: 'other', status: 'API Active', risk: 'low', notes: 'Smart parking solutions, contactless payment', monthlyVolume: 95000, email: 'ap@parkease.io', setupDate: '2025-07-01' },
  { name: 'TutorConnect', company: 'TutorConnect Education', industry: 'other', status: 'API Active', risk: 'low', notes: 'Online tutoring marketplace, session-based billing', monthlyVolume: 210000, email: 'billing@tutorconnect.com', setupDate: '2025-01-28' },
  { name: 'GymForge', company: 'GymForge Fitness', industry: 'healthcare', status: 'API Active', risk: 'low', notes: 'Gym chain, recurring memberships', monthlyVolume: 380000, email: 'pay@gymforge.com', setupDate: '2024-09-15' },
  { name: 'EventSpark', company: 'EventSpark Productions', industry: 'other', status: 'KYC In Progress', risk: 'medium', notes: 'Event ticketing platform, seasonal volume', monthlyVolume: 450000, email: 'finance@eventspark.co', setupDate: '2026-03-10' },
  { name: 'LaundryNow', company: 'LaundryNow Services', industry: 'other', status: 'API Active', risk: 'low', notes: 'On-demand laundry pickup/delivery', monthlyVolume: 65000, email: 'billing@laundrynow.co', setupDate: '2025-10-25' },
  { name: 'VetCare Plus', company: 'VetCare Plus Clinic', industry: 'healthcare', status: 'API Active', risk: 'low', notes: 'Veterinary clinic chain, 3 locations', monthlyVolume: 275000, email: 'ar@vetcareplus.com', setupDate: '2025-05-15' },
  { name: 'CharityBridge', company: 'CharityBridge Foundation', industry: 'other', status: 'Rejected', risk: 'high', notes: 'Non-profit donation platform, rejected due to incomplete documentation and suspicious transaction patterns', monthlyVolume: 0, email: 'info@charitybridge.org', setupDate: '2026-01-05' },
];

const ALL_MERCHANTS = [...ECOMMERCE, ...RETAIL, ...SAAS, ...FOOD_SERVICE, ...OTHER];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  const mapping: Record<string, string> = {
    'Submitted': 'Submitted',
    'KYC In Progress': 'KYC In Progress',
    'KYC Verified': 'KYC Verified',
    'Contract Signed': 'Contract Signed',
    'API Active': 'API Active',
    'Rejected': 'Rejected',
  };
  return groups[mapping[status] || 'Submitted'];
}

export async function seedMerchants(
  ctx: NovaPayContext,
  board: BoardContext
): Promise<void> {
  console.log(`[NovaPay] Seeding ${ALL_MERCHANTS.length} merchants...`);

  const accountManagers = [ctx.managerId, ctx.analystId, ctx.userId];

  for (let i = 0; i < ALL_MERCHANTS.length; i++) {
    const m = ALL_MERCHANTS[i];
    const groupId = getGroupForStatus(m.status, board.groups);

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: m.name,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Company Name'], value: m.company },
      { itemId: item.id, columnId: board.columns['Application Status'], value: m.status },
      { itemId: item.id, columnId: board.columns['Risk Assessment'], value: m.risk },
      { itemId: item.id, columnId: board.columns['Compliance Notes'], value: m.notes },
      { itemId: item.id, columnId: board.columns['Setup Date'], value: m.setupDate },
      { itemId: item.id, columnId: board.columns['Monthly Volume'], value: m.monthlyVolume },
      { itemId: item.id, columnId: board.columns['Industry'], value: m.industry },
      { itemId: item.id, columnId: board.columns['Contact Email'], value: m.email },
      { itemId: item.id, columnId: board.columns['Account Manager'], value: accountManagers[i % accountManagers.length] },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[NovaPay] Seeded ${ALL_MERCHANTS.length} merchants across ${Object.keys(board.groups).length} groups`);
}

export { ALL_MERCHANTS };
