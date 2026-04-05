import { Item, ColumnValue } from '../../models';
import { JurisPathContext } from './workspace';
import { BoardContext } from './boards';

interface CaseRecord {
  caseName: string;
  status: string;
  clientName: string;
  caseType: string;
  filingDate: string;
  completionDate: string | null;
  notes: string;
}

// ─── 20 Litigation Cases ────────────────────────────────────────────────────

const LITIGATION_CASES: CaseRecord[] = [
  { caseName: 'Holloway v. Pinnacle Technologies', status: 'Discovery', clientName: 'Margaret Holloway', caseType: 'litigation', filingDate: '2025-06-15', completionDate: null, notes: 'Employment discrimination — wrongful termination. Document production ongoing. Depositions scheduled for May 2026.' },
  { caseName: 'Park v. HomeComfort Appliances', status: 'Motions', clientName: 'David & Susan Park', caseType: 'litigation', filingDate: '2025-03-20', completionDate: null, notes: 'Product liability. Summary judgment motion filed. Expert report on defective heating element submitted.' },
  { caseName: 'Greenfield Properties v. Rodriguez Construction', status: 'Trial', clientName: 'Rodriguez Construction LLC', caseType: 'litigation', filingDate: '2025-09-05', completionDate: null, notes: 'Construction defect. Trial date set for June 2026. 12 witnesses identified. Damages estimated at $1.8M.' },
  { caseName: 'Estate of Thompson — Will Contest', status: 'Discovery', clientName: 'Thompson Estate', caseType: 'litigation', filingDate: '2025-02-28', completionDate: null, notes: 'Three beneficiaries contesting trust allocation. Mediation attempted, unsuccessful. Full discovery ordered.' },
  { caseName: 'Mendez v. TransitCo Trucking', status: 'Motions', clientName: 'Carlos Mendez', caseType: 'litigation', filingDate: '2025-07-10', completionDate: null, notes: 'Personal injury — rear-end collision. Motion to compel IME. Medical specials exceed $340K.' },
  { caseName: 'Harrison Manufacturing v. SupplyPro Inc', status: 'Discovery', clientName: 'Harrison Manufacturing v. SupplyPro', caseType: 'litigation', filingDate: '2025-05-15', completionDate: null, notes: 'Breach of contract — $2.4M in damages. 50,000 documents in review. E-discovery vendor engaged.' },
  { caseName: 'Westfield HOA v. Apex Builders', status: 'Intake', clientName: 'Westfield HOA', caseType: 'litigation', filingDate: '2025-10-20', completionDate: null, notes: 'Zoning violation enforcement. Demand letter sent. Awaiting response before filing complaint.' },
  { caseName: 'O\'Brien v. Metro Construction Corp', status: 'Motions', clientName: 'Michael O\'Brien', caseType: 'litigation', filingDate: '2025-04-08', completionDate: null, notes: 'Workers comp denial appeal. Administrative hearing scheduled. Vocational expert retained.' },
  { caseName: 'Sunrise Bakery v. FranchiseCo International', status: 'Discovery', clientName: 'Sunrise Bakery Group', caseType: 'litigation', filingDate: '2025-08-25', completionDate: null, notes: 'Franchise agreement dispute. Interrogatories served. Franchisor financial records subpoenaed.' },
  { caseName: 'NextGen Robotics v. TechVenture Labs', status: 'Trial', clientName: 'NextGen Robotics', caseType: 'litigation', filingDate: '2025-11-01', completionDate: null, notes: 'Trade secret misappropriation. Preliminary injunction granted. Trial in 90 days.' },
  { caseName: 'Brennan v. Homeland Insurance Group', status: 'Discovery', clientName: 'Thomas Brennan', caseType: 'litigation', filingDate: '2025-12-15', completionDate: null, notes: 'Insurance bad faith. Claims file subpoenaed. Policyholder rights expert opinion pending.' },
  { caseName: 'Oakmont Partners — Securities Defense', status: 'Motions', clientName: 'Oakmont Investment Partners', caseType: 'litigation', filingDate: '2025-06-01', completionDate: null, notes: 'Securities fraud defense. Motion to dismiss based on loss causation. PSLRA discovery stay in effect.' },
  { caseName: 'Santos v. BuildRight Construction', status: 'Intake', clientName: 'Kevin & Maria Santos', caseType: 'litigation', filingDate: '2025-12-01', completionDate: null, notes: 'Property damage from adjacent construction. Structural engineer report received. Pre-suit demand in progress.' },
  { caseName: 'GlobalTech v. DataServ Solutions', status: 'Discovery', clientName: 'GlobalTech Solutions', caseType: 'litigation', filingDate: '2025-08-01', completionDate: null, notes: 'Contract dispute — $850K in damages. Data migration failure. Expert IT consultant retained.' },
  { caseName: 'Clearwater v. EPA — Enforcement Defense', status: 'Motions', clientName: 'Clearwater Environmental', caseType: 'litigation', filingDate: '2025-05-30', completionDate: null, notes: 'CWA enforcement defense. Administrative hearing. Environmental remediation plan submitted.' },
  { caseName: 'Chen Trust v. Trustee Williams', status: 'Trial', clientName: 'Chen Family Trust', caseType: 'litigation', filingDate: '2025-09-10', completionDate: null, notes: 'Trust contest. Bench trial. Trustee challenged on investment performance and fee disclosures.' },
  { caseName: 'Fitzgerald v. Doe (Defamation)', status: 'Discovery', clientName: 'James Fitzgerald', caseType: 'litigation', filingDate: '2025-07-25', completionDate: null, notes: 'Online defamation. ISP subpoena to identify anonymous poster. Anti-SLAPP motion defeated.' },
  { caseName: 'Riverside Medical Center — MedMal Defense', status: 'Discovery', clientName: 'Riverside Medical Center', caseType: 'litigation', filingDate: '2025-09-20', completionDate: null, notes: 'Surgical complication — defense. Three expert witnesses retained. Plaintiff deposition completed.' },
  { caseName: 'Metro Transit — Multi-Claimant Tort', status: 'Motions', clientName: 'Metro Transit Authority', caseType: 'litigation', filingDate: '2025-03-01', completionDate: null, notes: 'Government tort defense. 8 plaintiffs consolidated. Sovereign immunity arguments pending.' },
  { caseName: 'Harmon & Steele — Prof Liability', status: 'Intake', clientName: 'Harmon & Steele Architects', caseType: 'litigation', filingDate: '2025-12-10', completionDate: null, notes: 'E&O defense. Building owner alleges design defects. Insurance carrier notified. Investigation phase.' },
];

// ─── 20 Corporate Cases ─────────────────────────────────────────────────────

const CORPORATE_CASES: CaseRecord[] = [
  { caseName: 'Meridian Capital — Series C Acquisition', status: 'Discovery', clientName: 'Meridian Capital Partners', caseType: 'corporate', filingDate: '2025-07-01', completionDate: null, notes: 'Target company due diligence. Reviewing financials, IP portfolio, and employment agreements. LOI executed.' },
  { caseName: 'Pinnacle Tech — Board Governance Review', status: 'Closed', clientName: 'Pinnacle Technologies Inc', caseType: 'corporate', filingDate: '2025-02-01', completionDate: '2025-11-15', notes: 'Completed comprehensive board governance review. Updated bylaws, committee charters, and D&O policies.' },
  { caseName: 'Harborview — JV Waterfront Project', status: 'Motions', clientName: 'Harborview Developments LLC', caseType: 'corporate', filingDate: '2025-04-01', completionDate: null, notes: 'Joint venture structuring. Operating agreement in final draft. Environmental impact review pending.' },
  { caseName: 'Atlas Freight — Interstate Compliance', status: 'Closed', clientName: 'Atlas Freight Systems', caseType: 'corporate', filingDate: '2024-12-01', completionDate: '2025-08-30', notes: 'Completed FMCSA compliance audit. Updated carrier agreements across 12 states.' },
  { caseName: 'Nexus Financial — SEC Filing', status: 'Discovery', clientName: 'Nexus Financial Group', caseType: 'corporate', filingDate: '2025-04-15', completionDate: null, notes: 'Annual SEC filings preparation. Form ADV update. New compliance procedures for ESG reporting.' },
  { caseName: 'Brightstar — Broadcast Acquisition', status: 'Motions', clientName: 'Brightstar Media Holdings', caseType: 'corporate', filingDate: '2025-08-01', completionDate: null, notes: 'FCC approval required. Antitrust analysis in progress. Purchase price $45M. HSR filing prepared.' },
  { caseName: 'Vanguard — Government Contract Review', status: 'Closed', clientName: 'Vanguard Construction Group', caseType: 'corporate', filingDate: '2025-10-01', completionDate: '2026-02-15', notes: 'Completed FAR compliance review. Surety bond program updated. New subcontractor qualification process.' },
  { caseName: 'Ironclad — Supply Chain Restructuring', status: 'Discovery', clientName: 'Ironclad Manufacturing', caseType: 'corporate', filingDate: '2025-06-01', completionDate: null, notes: 'Renegotiating 15 supplier contracts post-tariff. Force majeure clauses under review.' },
  { caseName: 'Pacific Rim — Trade Compliance', status: 'Closed', clientName: 'Pacific Rim Trading Co', caseType: 'corporate', filingDate: '2025-03-15', completionDate: '2025-12-20', notes: 'Completed customs compliance audit. Import classification review. Voluntary disclosure filed.' },
  { caseName: 'Sterling Aerospace — ITAR Review', status: 'Discovery', clientName: 'Sterling Aerospace LLC', caseType: 'corporate', filingDate: '2025-09-01', completionDate: null, notes: 'ITAR compliance assessment. Technology control plans under development. DDTC registration current.' },
  { caseName: 'Crestline — Hotel Acquisition', status: 'Motions', clientName: 'Crestline Hospitality Group', caseType: 'corporate', filingDate: '2025-12-01', completionDate: null, notes: '120-room hotel acquisition. Phase I environmental complete. Title insurance and franchise transfer pending.' },
  { caseName: 'Titan Logistics — Cross-Border Ops', status: 'Discovery', clientName: 'Titan Logistics International', caseType: 'corporate', filingDate: '2025-10-15', completionDate: null, notes: 'Setting up Mexican subsidiary. IMMEX registration and customs broker agreements.' },
  { caseName: 'Redwood Pharma — Drug Licensing', status: 'Motions', clientName: 'Redwood Pharmaceuticals', caseType: 'corporate', filingDate: '2025-12-20', completionDate: null, notes: 'Exclusive licensing agreement for oncology compound. Royalty structure and milestone payments under negotiation.' },
  { caseName: 'Centennial Bank — Fintech Partnership', status: 'Closed', clientName: 'Centennial Bank & Trust', caseType: 'corporate', filingDate: '2025-07-15', completionDate: '2026-01-10', notes: 'Completed BaaS partnership agreement. API licensing, data sharing, and regulatory carve-outs finalized.' },
  { caseName: 'Apex Ventures — Fund IV Formation', status: 'Discovery', clientName: 'Apex Ventures LLC', caseType: 'corporate', filingDate: '2025-07-20', completionDate: null, notes: 'LP agreement drafting. $200M target. Side letter negotiations with 3 anchor LPs.' },
  { caseName: 'Coastal Marine — Vessel Chartering', status: 'Closed', clientName: 'Coastal Marine Services', caseType: 'corporate', filingDate: '2025-05-01', completionDate: '2025-11-30', notes: 'Completed 5-year charter agreements for 3 vessels. Jones Act compliance verified.' },
  { caseName: 'Whitehall — Estate Planning', status: 'Discovery', clientName: 'Whitehall Investment Trust', caseType: 'corporate', filingDate: '2025-10-01', completionDate: null, notes: 'Multi-generational wealth transfer. GRAT structures, family LLC, and charitable remainder trusts.' },
  { caseName: 'UrbanGrid — Municipal Contracts', status: 'Motions', clientName: 'UrbanGrid Smart Cities', caseType: 'corporate', filingDate: '2025-11-15', completionDate: null, notes: 'Smart city infrastructure RFP response. Public-private partnership framework and data governance.' },
  { caseName: 'Summit Ridge — CLO Structuring', status: 'Discovery', clientName: 'Summit Ridge Capital', caseType: 'corporate', filingDate: '2025-10-25', completionDate: null, notes: 'CLO II structuring. Warehouse facility with $150M capacity. Indenture trustee selection.' },
  { caseName: 'Keystone — Privacy Compliance', status: 'Closed', clientName: 'Keystone Data Systems', caseType: 'corporate', filingDate: '2025-07-01', completionDate: '2026-01-30', notes: 'Completed CCPA/GDPR compliance program. DPAs with 30 vendors. Privacy impact assessments.' },
];

// ─── 12 IP Cases ────────────────────────────────────────────────────────────

const IP_CASES: CaseRecord[] = [
  { caseName: 'Luminos AI — Patent Portfolio Prosecution', status: 'Discovery', clientName: 'Luminos AI Research', caseType: 'ip', filingDate: '2025-05-01', completionDate: null, notes: '12 pending applications. Office action responses for 4 applications. PCT national phase entries due.' },
  { caseName: 'Artisan Coffee — Trademark Opposition', status: 'Motions', clientName: 'Artisan Coffee Brands', caseType: 'ip', filingDate: '2025-08-01', completionDate: null, notes: 'TTAB opposition proceeding. Opposer claims likelihood of confusion. Discovery period active.' },
  { caseName: 'NeuroLink — Patent Licensing', status: 'Discovery', clientName: 'NeuroLink Diagnostics', caseType: 'ip', filingDate: '2025-02-15', completionDate: null, notes: 'Non-exclusive licensing to Asian distributor. Royalty rates and field-of-use restrictions.' },
  { caseName: 'Forte Games — Merchandising IP', status: 'Closed', clientName: 'Forte Game Studios', caseType: 'ip', filingDate: '2025-10-01', completionDate: '2026-02-28', notes: 'Completed character IP licensing for toy manufacturer. Worldwide rights, 5-year term.' },
  { caseName: 'SolarFlare — IPR Defense', status: 'Trial', clientName: 'SolarFlare Technologies', caseType: 'ip', filingDate: '2025-07-15', completionDate: null, notes: 'Inter partes review at PTAB. Oral hearing scheduled. 2 of 3 claims survived institution.' },
  { caseName: 'Velocity Sport — Trade Dress Infringement', status: 'Discovery', clientName: 'Velocity Sportswear', caseType: 'ip', filingDate: '2025-04-10', completionDate: null, notes: 'TRO obtained. Competitor products seized at port. Survey evidence being collected.' },
  { caseName: 'PharmaCure — Hatch-Waxman Litigation', status: 'Trial', clientName: 'PharmaCure Biotech', caseType: 'ip', filingDate: '2025-06-20', completionDate: null, notes: 'ANDA Para IV challenge. 30-month stay in effect. Claim construction hearing completed.' },
  { caseName: 'AeroVista — Patent Troll Defense', status: 'Motions', clientName: 'AeroVista Drones', caseType: 'ip', filingDate: '2025-09-15', completionDate: null, notes: 'NPE asserting 3 patents. Alice/101 motion filed. Markman hearing scheduled for April 2026.' },
  { caseName: 'QuantumBridge — Trade Secret Protection', status: 'Intake', clientName: 'QuantumBridge Computing', caseType: 'ip', filingDate: '2025-12-20', completionDate: null, notes: 'Trade secret audit. Employee NDA/NCA program. Lab access controls and IP compartmentalization.' },
  { caseName: 'EchoWave — ITC Patent Investigation', status: 'Discovery', clientName: 'EchoWave Speakers', caseType: 'ip', filingDate: '2025-05-10', completionDate: null, notes: 'ITC Section 337 investigation. Chinese respondent. Limited exclusion order sought.' },
  { caseName: 'NanoMed — Priority Dispute', status: 'Motions', clientName: 'NanoMed Therapeutics', caseType: 'ip', filingDate: '2025-08-15', completionDate: null, notes: 'Derivation proceeding. European competitor claims earlier conception. Lab notebooks under review.' },
  { caseName: 'Pacific Genome — Patentability Strategy', status: 'Intake', clientName: 'Pacific Genome Labs', caseType: 'ip', filingDate: '2025-04-01', completionDate: null, notes: 'Gene therapy method claims. Navigating Mayo/Myriad framework. Provisional application drafted.' },
];

// ─── 8 Other Cases ──────────────────────────────────────────────────────────

const OTHER_CASES: CaseRecord[] = [
  { caseName: 'Vasquez — Medical Malpractice Settlement', status: 'Closed', clientName: 'Dr. Elena Vasquez', caseType: 'other', filingDate: '2024-10-01', completionDate: '2025-03-15', notes: 'MedMal defense settled. Confidential settlement, no admission. Insurance carrier satisfied.' },
  { caseName: 'Foster — Unlawful Eviction', status: 'Closed', clientName: 'Angela Foster', caseType: 'other', filingDate: '2024-08-01', completionDate: '2025-01-20', notes: 'Obtained treble damages. Landlord paid $45K settlement plus attorney fees.' },
  { caseName: 'Crawford — Boundary Dispute', status: 'Closed', clientName: 'Janet & William Crawford', caseType: 'other', filingDate: '2024-12-01', completionDate: '2025-06-10', notes: 'Survey resolved boundary line. Easement agreement executed. Fence relocated.' },
  { caseName: 'DiNapoli — Wrongful Death Settlement', status: 'Closed', clientName: 'Anthony DiNapoli', caseType: 'other', filingDate: '2024-09-15', completionDate: '2025-04-22', notes: 'Industrial accident wrongful death. $1.2M settlement. OSHA citation confirmed employer violation.' },
  { caseName: 'Mitchell — DUI Defense', status: 'Closed', clientName: 'Ryan Mitchell', caseType: 'other', filingDate: '2024-07-10', completionDate: '2024-12-18', notes: 'Charges reduced to reckless driving. Breathalyzer calibration records challenged successfully.' },
  { caseName: 'Precision Auto — Consumer Fraud Defense', status: 'Closed', clientName: 'Precision Auto Group', caseType: 'other', filingDate: '2024-11-01', completionDate: '2025-05-30', notes: 'Class action threat. Resolved through individual settlement with 3 claimants. Business practices updated.' },
  { caseName: 'Bayshore Condo — Construction Defect', status: 'Closed', clientName: 'Bayshore Condominium Assoc', caseType: 'other', filingDate: '2025-01-15', completionDate: '2025-09-25', notes: 'Roof membrane failure. Developer paid full repair cost of $380K. 10-year warranty obtained.' },
  { caseName: 'Greenfield Organics — FDA Compliance', status: 'Closed', clientName: 'Greenfield Organics Corp', caseType: 'other', filingDate: '2024-09-01', completionDate: '2025-02-28', notes: 'FDA labeling compliance review completed. Updated labels for 45 SKUs. No violations found.' },
];

const ALL_CASES = [...LITIGATION_CASES, ...CORPORATE_CASES, ...IP_CASES, ...OTHER_CASES];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Intake'];
}

export async function seedCases(
  ctx: JurisPathContext,
  board: BoardContext
): Promise<void> {
  console.log(`[JurisPath] Seeding ${ALL_CASES.length} cases...`);

  for (let i = 0; i < ALL_CASES.length; i++) {
    const c = ALL_CASES[i];
    const groupId = getGroupForStatus(c.status, board.groups);
    const caseId = `JP-${String(2025000 + i).padStart(7, '0')}`;
    const leadAttorney = ctx.allAttorneyIds[i % ctx.allAttorneyIds.length];
    // Use a different attorney as client reference (person column)
    const clientPerson = ctx.allAttorneyIds[(i + 5) % ctx.allAttorneyIds.length];

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: `${caseId} — ${c.caseName}`,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Status'], value: c.status },
      { itemId: item.id, columnId: board.columns['Client'], value: clientPerson },
      { itemId: item.id, columnId: board.columns['Lead Attorney'], value: leadAttorney },
      { itemId: item.id, columnId: board.columns['Case Type'], value: c.caseType },
      { itemId: item.id, columnId: board.columns['Filing Date'], value: c.filingDate },
      { itemId: item.id, columnId: board.columns['Completion Date'], value: c.completionDate },
      { itemId: item.id, columnId: board.columns['Case Notes'], value: c.notes },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[JurisPath] Seeded ${ALL_CASES.length} cases across ${Object.keys(board.groups).length} groups`);
}
