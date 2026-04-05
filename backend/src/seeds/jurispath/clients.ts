import { Item, ColumnValue } from '../../models';
import { JurisPathContext } from './workspace';
import { BoardContext } from './boards';

export interface ClientRecord {
  name: string;
  contact: string;
  matterType: string;
  status: string;
  consultDate: string;
  notes: string;
}

// ─── 35 Corporate Clients ───────────────────────────────────────────────────

const CORPORATE_CLIENTS: ClientRecord[] = [
  { name: 'Meridian Capital Partners', contact: '(212) 555-0101 | legal@meridiancap.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-06-15', notes: 'PE fund, ongoing M&A advisory. Retained for Series C acquisition target due diligence.' },
  { name: 'Pinnacle Technologies Inc', contact: '(415) 555-0202 | counsel@pinnacletech.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-01-20', notes: 'SaaS company, general corporate counsel. Board governance and stock option plan review.' },
  { name: 'Harborview Developments LLC', contact: '(310) 555-0303 | office@harborview.dev', matterType: 'corporate', status: 'Engaged', consultDate: '2025-03-10', notes: 'Real estate developer. Joint venture structuring for mixed-use waterfront project.' },
  { name: 'Atlas Freight Systems', contact: '(773) 555-0404 | legal@atlasfreight.com', matterType: 'corporate', status: 'Engaged', consultDate: '2024-11-05', notes: 'Logistics company. Regulatory compliance and interstate commerce agreements.' },
  { name: 'Greenfield Organics Corp', contact: '(503) 555-0505 | ceo@greenfieldorganics.com', matterType: 'corporate', status: 'Completed', consultDate: '2024-08-22', notes: 'Organic food company. Completed FDA labeling compliance review.' },
  { name: 'Nexus Financial Group', contact: '(212) 555-0606 | compliance@nexusfin.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-04-01', notes: 'Investment advisory firm. SEC regulatory filings and compliance framework.' },
  { name: 'Brightstar Media Holdings', contact: '(323) 555-0707 | legal@brightstarmedia.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-07-18', notes: 'Media conglomerate. Acquisition of regional broadcast network — antitrust review.' },
  { name: 'Summit Health Partners', contact: '(617) 555-0808 | admin@summithealth.com', matterType: 'corporate', status: 'Consultation', consultDate: '2026-01-12', notes: 'Healthcare group practice. Exploring merger with regional hospital system.' },
  { name: 'Vanguard Construction Group', contact: '(469) 555-0909 | ops@vanguardcg.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-09-14', notes: 'Commercial construction. Government contract compliance and surety bond matters.' },
  { name: 'Cascade Energy Solutions', contact: '(206) 555-1010 | legal@cascadeenergy.com', matterType: 'corporate', status: 'Completed', consultDate: '2024-06-30', notes: 'Clean energy startup. Completed Series B financing documentation.' },
  { name: 'Ironclad Manufacturing', contact: '(313) 555-1111 | cfo@ironcladmfg.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-05-08', notes: 'Automotive parts manufacturer. Supply chain contract renegotiations post-tariff.' },
  { name: 'Pacific Rim Trading Co', contact: '(415) 555-1212 | imports@pacificrim.co', matterType: 'corporate', status: 'Engaged', consultDate: '2025-02-28', notes: 'Import/export firm. International trade compliance and customs law.' },
  { name: 'Sterling Aerospace LLC', contact: '(256) 555-1313 | contracts@sterlingaero.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-08-04', notes: 'Defense subcontractor. ITAR compliance review and export control advisory.' },
  { name: 'Oakwood Senior Living', contact: '(404) 555-1414 | admin@oakwoodsl.com', matterType: 'corporate', status: 'Consultation', consultDate: '2026-02-05', notes: 'Senior care facility chain. Exploring franchise model — franchise agreement drafting.' },
  { name: 'BlueWave Digital Agency', contact: '(512) 555-1515 | founder@bluewavedigital.com', matterType: 'corporate', status: 'Completed', consultDate: '2024-10-15', notes: 'Digital marketing agency. Completed operating agreement restructuring for new equity partners.' },
  { name: 'Crestline Hospitality Group', contact: '(305) 555-1616 | legal@crestlinehotels.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-11-20', notes: 'Hotel management company. Hotel acquisition and management agreement negotiations.' },
  { name: 'Sagebrush Capital Advisors', contact: '(720) 555-1717 | partners@sagebrushcap.com', matterType: 'corporate', status: 'Inquiry', consultDate: '2026-03-15', notes: 'New inquiry. Wealth management firm seeking fund formation counsel.' },
  { name: 'Titan Logistics International', contact: '(832) 555-1818 | compliance@titanlog.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-10-01', notes: 'Global logistics provider. Cross-border regulatory compliance and freight agreements.' },
  { name: 'Redwood Pharmaceuticals', contact: '(858) 555-1919 | regulatory@redwoodpharma.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-12-08', notes: 'Biotech firm. FDA drug approval pathway and licensing agreements.' },
  { name: 'Centennial Bank & Trust', contact: '(704) 555-2020 | legal@centennialbank.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-06-25', notes: 'Regional bank. Regulatory compliance, BSA/AML policy review, and fintech partnership agreements.' },
  { name: 'Horizon Agritech', contact: '(515) 555-2121 | ceo@horizonagri.com', matterType: 'corporate', status: 'Completed', consultDate: '2024-09-10', notes: 'Ag-tech startup. Completed seed round and IP assignment agreements.' },
  { name: 'Cobalt Mining Corp', contact: '(801) 555-2222 | legal@cobaltmining.com', matterType: 'corporate', status: 'Consultation', consultDate: '2026-01-28', notes: 'Mining company. Environmental regulatory compliance and mineral rights acquisition.' },
  { name: 'Apex Ventures LLC', contact: '(650) 555-2323 | gp@apexventures.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-07-02', notes: 'VC firm. Fund IV formation, LP agreements, and portfolio company governance.' },
  { name: 'Coastal Marine Services', contact: '(904) 555-2424 | ops@coastalmarine.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-04-18', notes: 'Maritime services. Jones Act compliance and vessel chartering agreements.' },
  { name: 'FrostByte Cybersecurity', contact: '(571) 555-2525 | ciso@frostbyte.io', matterType: 'ip', status: 'Engaged', consultDate: '2025-08-30', notes: 'Cybersecurity firm. Data breach response planning and government contract security requirements.' },
  { name: 'Grandview Properties', contact: '(602) 555-2626 | acquisitions@grandviewprop.com', matterType: 'corporate', status: 'Completed', consultDate: '2024-12-03', notes: 'Commercial REIT. Completed 1031 exchange and property acquisition documentation.' },
  { name: 'Evergreen Insurance Solutions', contact: '(503) 555-2727 | claims@evergreenins.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-03-25', notes: 'Insurance brokerage. E&O policy review and agency agreement restructuring.' },
  { name: 'Nova Semiconductor', contact: '(408) 555-2828 | legal@novasemi.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-05-15', notes: 'Chip design company. Patent portfolio strategy and licensing negotiations.' },
  { name: 'Whitehall Investment Trust', contact: '(212) 555-2929 | trustees@whitehall.trust', matterType: 'corporate', status: 'Engaged', consultDate: '2025-09-22', notes: 'Family office. Trust administration, estate planning, and generational wealth transfer.' },
  { name: 'Prairie Wind Energy', contact: '(316) 555-3030 | dev@prairiewind.energy', matterType: 'corporate', status: 'Inquiry', consultDate: '2026-03-01', notes: 'Wind energy developer. PPA negotiation and land lease agreement review.' },
  { name: 'Beacon Biomedical Devices', contact: '(919) 555-3131 | regulatory@beaconbio.com', matterType: 'ip', status: 'Consultation', consultDate: '2026-02-18', notes: 'Medical device startup. Patent prosecution and FDA 510(k) regulatory strategy.' },
  { name: 'UrbanGrid Smart Cities', contact: '(512) 555-3232 | partnerships@urbangrid.ai', matterType: 'corporate', status: 'Engaged', consultDate: '2025-11-05', notes: 'Smart city technology provider. Municipal contract negotiations and data privacy compliance.' },
  { name: 'Summit Ridge Capital', contact: '(303) 555-3333 | ir@summitridgecap.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-10-12', notes: 'Private credit fund. CLO structuring and warehouse facility agreements.' },
  { name: 'Lakeside Brewing Company', contact: '(414) 555-3434 | legal@lakesidebrew.com', matterType: 'corporate', status: 'Completed', consultDate: '2024-07-20', notes: 'Craft brewery. Completed TTB licensing, distribution agreements, and trademark registration.' },
  { name: 'Keystone Data Systems', contact: '(484) 555-3535 | privacy@keystonedata.com', matterType: 'corporate', status: 'Engaged', consultDate: '2025-06-10', notes: 'Data analytics firm. CCPA/GDPR compliance program and data processing agreements.' },
];

// ─── 35 Litigation Clients ──────────────────────────────────────────────────

const LITIGATION_CLIENTS: ClientRecord[] = [
  { name: 'Margaret Holloway', contact: '(555) 401-0001 | m.holloway@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-05-22', notes: 'Employment discrimination claim. Former VP at tech company, wrongful termination.' },
  { name: 'David & Susan Park', contact: '(555) 401-0002 | parkfamily@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-02-14', notes: 'Product liability — defective home appliance caused property damage.' },
  { name: 'Rodriguez Construction LLC', contact: '(555) 401-0003 | jrodriguez@rodconstruction.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-08-10', notes: 'Construction defect dispute. General contractor sued by property owner.' },
  { name: 'Dr. Elena Vasquez', contact: '(555) 401-0004 | e.vasquez@medclinic.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-09-18', notes: 'Medical malpractice defense. Settled favorably — no admission of liability.' },
  { name: 'Thompson Estate', contact: '(555) 401-0005 | executor@thompsonlaw.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-01-30', notes: 'Contested will — three beneficiaries disputing trust allocation provisions.' },
  { name: 'Carlos Mendez', contact: '(555) 401-0006 | cmendez77@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-06-03', notes: 'Personal injury — car accident, significant medical expenses. Defendant has commercial insurance.' },
  { name: 'Patricia Nguyen', contact: '(555) 401-0007 | pnguyen@email.com', matterType: 'litigation', status: 'Inquiry', consultDate: '2026-03-10', notes: 'Potential slip-and-fall at retail store. Reviewing incident report and medical records.' },
  { name: 'Harrison Manufacturing v. SupplyPro', contact: '(555) 401-0008 | legal@harrisonmfg.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-04-12', notes: 'Breach of contract — supplier failed to deliver materials per specification, $2.4M in damages.' },
  { name: 'Angela Foster', contact: '(555) 401-0009 | afoster@email.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-07-08', notes: 'Landlord-tenant dispute. Unlawful eviction — obtained treble damages.' },
  { name: 'Westfield HOA', contact: '(555) 401-0010 | board@westfieldhoa.org', matterType: 'litigation', status: 'Engaged', consultDate: '2025-09-28', notes: 'HOA enforcement action against commercial property developer. Zoning violation.' },
  { name: 'Michael O\'Brien', contact: '(555) 401-0011 | mobrien@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-03-15', notes: 'Workers compensation denial appeal. Construction injury, permanent partial disability.' },
  { name: 'Sunrise Bakery Group', contact: '(555) 401-0012 | owner@sunrisebakery.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-07-22', notes: 'Franchise agreement dispute. Franchisor imposed unreasonable territory restrictions.' },
  { name: 'Janet & William Crawford', contact: '(555) 401-0013 | crawfordfamily@email.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-11-12', notes: 'Boundary dispute with neighbor. Survey completed, easement agreement reached.' },
  { name: 'NextGen Robotics', contact: '(555) 401-0014 | counsel@nextgenrobotics.ai', matterType: 'litigation', status: 'Engaged', consultDate: '2025-10-08', notes: 'Trade secret misappropriation. Former CTO started competing company using proprietary algorithms.' },
  { name: 'Grace Liu', contact: '(555) 401-0015 | gliu@email.com', matterType: 'litigation', status: 'Consultation', consultDate: '2026-02-22', notes: 'Age discrimination claim. Senior engineer passed over for promotion, 25 years tenure.' },
  { name: 'Riverside Medical Center', contact: '(555) 401-0016 | risk@riversidemc.org', matterType: 'litigation', status: 'Engaged', consultDate: '2025-08-30', notes: 'Medical malpractice defense — surgical complication. Expert witnesses retained.' },
  { name: 'Thomas Brennan', contact: '(555) 401-0017 | tbrennan@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-12-01', notes: 'Insurance bad faith claim. Homeowner policy denied after fire damage — clear coverage.' },
  { name: 'Precision Auto Group', contact: '(555) 401-0018 | legal@precisionauto.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-10-05', notes: 'Consumer fraud defense. Class action threat resolved through individual settlement.' },
  { name: 'Rebecca Saunders', contact: '(555) 401-0019 | rsaunders@email.com', matterType: 'litigation', status: 'Inquiry', consultDate: '2026-03-18', notes: 'Potential harassment claim. Documenting workplace incidents over 18 months.' },
  { name: 'Oakmont Investment Partners', contact: '(555) 401-0020 | disputes@oakmontinv.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-05-10', notes: 'Securities fraud defense. Investor alleging material misrepresentation in fund prospectus.' },
  { name: 'Kevin & Maria Santos', contact: '(555) 401-0021 | santosfamily@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-11-15', notes: 'Property damage — neighboring construction caused foundation cracking.' },
  { name: 'GlobalTech Solutions', contact: '(555) 401-0022 | legal@globaltechsol.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-07-05', notes: 'Contract dispute with former vendor. $850K in unpaid services and data migration failure.' },
  { name: 'Anthony DiNapoli', contact: '(555) 401-0023 | adinapoli@email.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-08-20', notes: 'Wrongful death settlement. Industrial accident — employer safety violation. Settled $1.2M.' },
  { name: 'Clearwater Environmental', contact: '(555) 401-0024 | compliance@clearwaterenv.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-04-28', notes: 'EPA enforcement action defense. Alleged Clean Water Act violations at processing facility.' },
  { name: 'Laura Whitfield', contact: '(555) 401-0025 | lwhitfield@email.com', matterType: 'litigation', status: 'Consultation', consultDate: '2026-01-08', notes: 'Non-compete enforcement. Former employer threatening suit over new position.' },
  { name: 'Prestige Motor Group', contact: '(555) 401-0026 | legal@prestigemotors.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-09-05', notes: 'Lemon law defense. Consumer claiming recurring transmission defect in luxury vehicle.' },
  { name: 'James Fitzgerald', contact: '(555) 401-0027 | jfitz@email.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-06-20', notes: 'Defamation claim. False statements published online by former business partner.' },
  { name: 'Bayshore Condominium Assoc', contact: '(555) 401-0028 | manager@bayshorecondo.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-12-10', notes: 'Construction defect claim against developer. Roof membrane failure — settled for full repair cost.' },
  { name: 'Dr. Raymond Walsh', contact: '(555) 401-0029 | rwalsh@medpractice.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-10-25', notes: 'Partnership dissolution dispute. Three-physician practice, disagreement over patient allocation.' },
  { name: 'Samantha Brooks', contact: '(555) 401-0030 | sbrooks@email.com', matterType: 'litigation', status: 'Inquiry', consultDate: '2026-03-25', notes: 'Potential whistleblower retaliation. Financial services employee reported compliance violations.' },
  { name: 'Metro Transit Authority', contact: '(555) 401-0031 | claims@metrotransit.gov', matterType: 'litigation', status: 'Engaged', consultDate: '2025-02-08', notes: 'Government tort defense. Bus accident resulting in multiple personal injury claims.' },
  { name: 'Chen Family Trust', contact: '(555) 401-0032 | trustee@chenfamilytrust.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-08-15', notes: 'Trust contest — beneficiary challenging trustee decisions and investment management.' },
  { name: 'Ryan Mitchell', contact: '(555) 401-0033 | rmitchell@email.com', matterType: 'litigation', status: 'Completed', consultDate: '2024-06-25', notes: 'DUI defense with injury. Reduced charges through procedural challenge and expert testimony.' },
  { name: 'Harmon & Steele Architects', contact: '(555) 401-0034 | partners@harmonsteele.com', matterType: 'litigation', status: 'Engaged', consultDate: '2025-11-30', notes: 'Professional liability defense. Building owner alleging design defects in commercial tower.' },
  { name: 'Yolanda Ruiz', contact: '(555) 401-0035 | yruiz@email.com', matterType: 'litigation', status: 'Consultation', consultDate: '2026-02-10', notes: 'Nursing home neglect. Elderly parent sustained injuries from fall — facility understaffed.' },
];

// ─── 30 IP Clients ──────────────────────────────────────────────────────────

const IP_CLIENTS: ClientRecord[] = [
  { name: 'Luminos AI Research', contact: '(650) 555-4001 | patents@luminosai.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-04-05', notes: 'AI/ML patent portfolio. 12 pending applications, 3 PCT filings, freedom-to-operate analysis.' },
  { name: 'Artisan Coffee Brands', contact: '(503) 555-4002 | brand@artisancoffee.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-07-12', notes: 'Trademark portfolio management. 8 marks across 3 product lines. Opposition proceeding pending.' },
  { name: 'NeuroLink Diagnostics', contact: '(617) 555-4003 | ip@neurolinkdx.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-01-25', notes: 'Medical device patents. 5 utility patents, 2 design patents. Licensing negotiations with distributor.' },
  { name: 'Forte Game Studios', contact: '(310) 555-4004 | legal@fortegames.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-09-08', notes: 'Video game IP — copyright, trademark, and licensing. Character IP merchandising deals.' },
  { name: 'Dr. Sarah Kessler', contact: '(555) 404-0005 | skessler@research.edu', matterType: 'ip', status: 'Completed', consultDate: '2024-11-18', notes: 'University professor. Patent on novel drug delivery mechanism — licensed to pharma company.' },
  { name: 'SolarFlare Technologies', contact: '(408) 555-4006 | ip@solarflaretec.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-06-30', notes: 'Solar panel efficiency patent. Inter partes review defense. Prior art search ongoing.' },
  { name: 'Velocity Sportswear', contact: '(971) 555-4007 | tm@velocitysport.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-03-20', notes: 'Trade dress and trademark. Competitor launched confusingly similar product line.' },
  { name: 'CryptoLedger Inc', contact: '(415) 555-4008 | ip@cryptoledger.io', matterType: 'ip', status: 'Consultation', consultDate: '2026-01-15', notes: 'Blockchain protocol patents. Evaluating defensive patent strategy and open-source licensing.' },
  { name: 'PharmaCure Biotech', contact: '(858) 555-4009 | patents@pharmacure.bio', matterType: 'ip', status: 'Engaged', consultDate: '2025-05-18', notes: 'Drug compound patents. Hatch-Waxman litigation — generic manufacturer filed ANDA.' },
  { name: 'Resonance Audio Labs', contact: '(512) 555-4010 | founder@resonanceaudio.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-10-15', notes: 'Audio processing technology patents. Licensing to consumer electronics manufacturers.' },
  { name: 'Verdant Cosmetics', contact: '(323) 555-4011 | brand@verdantbeauty.com', matterType: 'ip', status: 'Completed', consultDate: '2024-08-05', notes: 'Trademark registration for new product line. 4 marks registered across skincare categories.' },
  { name: 'AeroVista Drones', contact: '(303) 555-4012 | ip@aerovista.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-08-22', notes: 'Drone navigation patents. Defending against patent troll — 3 asserted patents.' },
  { name: 'Chef Marcus Williams', contact: '(555) 404-0013 | chef@marcuswilliams.com', matterType: 'ip', status: 'Completed', consultDate: '2024-10-30', notes: 'Celebrity chef. Cookbook copyright, restaurant name trademark, and licensing agreements.' },
  { name: 'QuantumBridge Computing', contact: '(571) 555-4014 | patents@quantumbridge.dev', matterType: 'ip', status: 'Engaged', consultDate: '2025-12-05', notes: 'Quantum computing algorithms. Provisional patent applications and trade secret protection.' },
  { name: 'Heritage Winery & Vineyards', contact: '(707) 555-4015 | legal@heritagewinery.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-02-10', notes: 'Wine label trademark dispute. Competitor using similar label design on imported wines.' },
  { name: 'BioSynth Materials', contact: '(919) 555-4016 | rd@biosynthmat.com', matterType: 'ip', status: 'Consultation', consultDate: '2026-02-28', notes: 'Novel biodegradable polymer. Evaluating patent strategy and joint venture IP ownership.' },
  { name: 'CloudForge Platform', contact: '(206) 555-4017 | ip@cloudforge.dev', matterType: 'ip', status: 'Engaged', consultDate: '2025-11-10', notes: 'Cloud infrastructure patents. Cross-licensing negotiation with major cloud provider.' },
  { name: 'EchoWave Speakers', contact: '(714) 555-4018 | legal@echowave.audio', matterType: 'ip', status: 'Engaged', consultDate: '2025-04-25', notes: 'Speaker design patents. ITC complaint against Chinese manufacturer for patent infringement.' },
  { name: 'Apex Fashion House', contact: '(212) 555-4019 | ip@apexfashion.com', matterType: 'ip', status: 'Completed', consultDate: '2024-09-15', notes: 'Fashion design copyright and trademark. Successfully stopped counterfeiting operation.' },
  { name: 'NanoMed Therapeutics', contact: '(617) 555-4020 | patents@nanomed.bio', matterType: 'ip', status: 'Engaged', consultDate: '2025-07-28', notes: 'Nanoparticle drug delivery patents. Priority dispute with European competitor.' },
  { name: 'DataStream Analytics', contact: '(512) 555-4021 | ip@datastreamanalytics.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-06-15', notes: 'Data visualization software patents. Defensive portfolio building and FRAND licensing.' },
  { name: 'Aether Wireless', contact: '(858) 555-4022 | patents@aetherwireless.com', matterType: 'ip', status: 'Inquiry', consultDate: '2026-03-20', notes: 'New client. 5G antenna technology patents — seeking prosecution and licensing counsel.' },
  { name: 'GreenBuild Materials', contact: '(720) 555-4023 | ip@greenbuild.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-09-30', notes: 'Sustainable building material patents. Trade secret audit and employee NDA program.' },
  { name: 'MindfulTech Wearables', contact: '(415) 555-4024 | legal@mindfultech.com', matterType: 'ip', status: 'Consultation', consultDate: '2026-01-30', notes: 'Wellness wearable patents. Evaluating design patent strategy for next-gen device.' },
  { name: 'Pacific Genome Labs', contact: '(858) 555-4025 | ip@pacificgenome.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-03-08', notes: 'Gene therapy patents. Navigating Myriad/Mayo patentability requirements.' },
  { name: 'Harmony Music Platform', contact: '(615) 555-4026 | legal@harmonymusic.app', matterType: 'ip', status: 'Engaged', consultDate: '2025-10-20', notes: 'Music streaming platform. Copyright licensing and DMCA compliance framework.' },
  { name: 'TerraForm Robotics', contact: '(512) 555-4027 | ip@terraformbot.com', matterType: 'ip', status: 'Completed', consultDate: '2024-12-15', notes: 'Agricultural robotics. 8 patents granted. Completed cross-license with competitor.' },
  { name: 'Vivid VR Studios', contact: '(310) 555-4028 | legal@vividvr.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-08-12', notes: 'VR content creation tools. Copyright, patent, and virtual environment design protection.' },
  { name: 'ProtonShield Security', contact: '(571) 555-4029 | ip@protonshield.com', matterType: 'ip', status: 'Engaged', consultDate: '2025-05-28', notes: 'Cybersecurity encryption patents. Government contract requirements and NIST compliance.' },
  { name: 'Alpine Ski Equipment', contact: '(801) 555-4030 | brand@alpineski.com', matterType: 'ip', status: 'Inquiry', consultDate: '2026-03-12', notes: 'Ski binding design patent and brand trademark expansion into European markets.' },
];

export const ALL_CLIENTS = [...CORPORATE_CLIENTS, ...LITIGATION_CLIENTS, ...IP_CLIENTS];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Inquiry'];
}

export async function seedClients(
  ctx: JurisPathContext,
  board: BoardContext
): Promise<void> {
  console.log(`[JurisPath] Seeding ${ALL_CLIENTS.length} client records...`);

  for (let i = 0; i < ALL_CLIENTS.length; i++) {
    const c = ALL_CLIENTS[i];
    const groupId = getGroupForStatus(c.status, board.groups);
    const attorneyId = ctx.allAttorneyIds[i % ctx.allAttorneyIds.length];

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: c.name,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Client Name'], value: c.name },
      { itemId: item.id, columnId: board.columns['Contact Info'], value: c.contact },
      { itemId: item.id, columnId: board.columns['Matter Type'], value: c.matterType },
      { itemId: item.id, columnId: board.columns['Status'], value: c.status },
      { itemId: item.id, columnId: board.columns['Initial Consultation'], value: c.consultDate },
      { itemId: item.id, columnId: board.columns['Assigned Attorney'], value: attorneyId },
      { itemId: item.id, columnId: board.columns['Intake Notes'], value: c.notes },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[JurisPath] Seeded ${ALL_CLIENTS.length} clients across ${Object.keys(board.groups).length} groups`);
}
