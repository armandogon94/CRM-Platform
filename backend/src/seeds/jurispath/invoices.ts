import { Item, ColumnValue } from '../../models';
import { JurisPathContext } from './workspace';
import { BoardContext } from './boards';

interface InvoiceRecord {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  hours: number;
  status: string;
  dueDate: string;
  matterRef: string;
}

const INVOICES: InvoiceRecord[] = [
  // ─── 8 Draft invoices ──────────────────────────────────────────────────
  { invoiceNumber: 'INV-2026-0401', clientName: 'Meridian Capital Partners', amount: 28500.00, hours: 57.0, status: 'Draft', dueDate: '2026-05-01', matterRef: 'Meridian Capital — Series C Acquisition' },
  { invoiceNumber: 'INV-2026-0402', clientName: 'NextGen Robotics', amount: 18750.00, hours: 37.5, status: 'Draft', dueDate: '2026-05-01', matterRef: 'NextGen Robotics v. TechVenture Labs' },
  { invoiceNumber: 'INV-2026-0403', clientName: 'QuantumBridge Computing', amount: 6200.00, hours: 12.4, status: 'Draft', dueDate: '2026-05-01', matterRef: 'QuantumBridge — Trade Secret Protection' },
  { invoiceNumber: 'INV-2026-0404', clientName: 'Crestline Hospitality Group', amount: 14300.00, hours: 28.6, status: 'Draft', dueDate: '2026-05-01', matterRef: 'Crestline — Hotel Acquisition' },
  { invoiceNumber: 'INV-2026-0405', clientName: 'Kevin & Maria Santos', amount: 3850.00, hours: 7.7, status: 'Draft', dueDate: '2026-05-01', matterRef: 'Santos v. BuildRight Construction' },
  { invoiceNumber: 'INV-2026-0406', clientName: 'NanoMed Therapeutics', amount: 22100.00, hours: 44.2, status: 'Draft', dueDate: '2026-05-01', matterRef: 'NanoMed — Priority Dispute' },
  { invoiceNumber: 'INV-2026-0407', clientName: 'Redwood Pharmaceuticals', amount: 31250.00, hours: 62.5, status: 'Draft', dueDate: '2026-05-01', matterRef: 'Redwood Pharma — Drug Licensing' },
  { invoiceNumber: 'INV-2026-0408', clientName: 'Harmon & Steele Architects', amount: 5100.00, hours: 10.2, status: 'Draft', dueDate: '2026-05-01', matterRef: 'Harmon & Steele — Prof Liability' },

  // ─── 15 Sent invoices ──────────────────────────────────────────────────
  { invoiceNumber: 'INV-2026-0301', clientName: 'Harrison Manufacturing v. SupplyPro', amount: 24600.00, hours: 49.2, status: 'Sent', dueDate: '2026-04-15', matterRef: 'Harrison Manufacturing v. SupplyPro Inc' },
  { invoiceNumber: 'INV-2026-0302', clientName: 'PharmaCure Biotech', amount: 42750.00, hours: 85.5, status: 'Sent', dueDate: '2026-04-20', matterRef: 'PharmaCure — Hatch-Waxman Litigation' },
  { invoiceNumber: 'INV-2026-0303', clientName: 'Brightstar Media Holdings', amount: 35400.00, hours: 70.8, status: 'Sent', dueDate: '2026-04-25', matterRef: 'Brightstar — Broadcast Acquisition' },
  { invoiceNumber: 'INV-2026-0304', clientName: 'Oakmont Investment Partners', amount: 19800.00, hours: 39.6, status: 'Sent', dueDate: '2026-04-10', matterRef: 'Oakmont Partners — Securities Defense' },
  { invoiceNumber: 'INV-2026-0305', clientName: 'Luminos AI Research', amount: 16250.00, hours: 32.5, status: 'Sent', dueDate: '2026-04-18', matterRef: 'Luminos AI — Patent Portfolio Prosecution' },
  { invoiceNumber: 'INV-2026-0306', clientName: 'Velocity Sportswear', amount: 28900.00, hours: 57.8, status: 'Sent', dueDate: '2026-04-22', matterRef: 'Velocity Sport — Trade Dress Infringement' },
  { invoiceNumber: 'INV-2026-0307', clientName: 'Carlos Mendez', amount: 8400.00, hours: 16.8, status: 'Sent', dueDate: '2026-04-12', matterRef: 'Mendez v. TransitCo Trucking' },
  { invoiceNumber: 'INV-2026-0308', clientName: 'Ironclad Manufacturing', amount: 11200.00, hours: 22.4, status: 'Sent', dueDate: '2026-04-30', matterRef: 'Ironclad — Supply Chain Restructuring' },
  { invoiceNumber: 'INV-2026-0309', clientName: 'Clearwater Environmental', amount: 21500.00, hours: 43.0, status: 'Sent', dueDate: '2026-04-08', matterRef: 'Clearwater v. EPA — Enforcement Defense' },
  { invoiceNumber: 'INV-2026-0310', clientName: 'EchoWave Speakers', amount: 33600.00, hours: 67.2, status: 'Sent', dueDate: '2026-04-28', matterRef: 'EchoWave — ITC Patent Investigation' },
  { invoiceNumber: 'INV-2026-0311', clientName: 'Summit Ridge Capital', amount: 27800.00, hours: 55.6, status: 'Sent', dueDate: '2026-04-15', matterRef: 'Summit Ridge — CLO Structuring' },
  { invoiceNumber: 'INV-2026-0312', clientName: 'Thomas Brennan', amount: 7650.00, hours: 15.3, status: 'Sent', dueDate: '2026-04-20', matterRef: 'Brennan v. Homeland Insurance Group' },
  { invoiceNumber: 'INV-2026-0313', clientName: 'AeroVista Drones', amount: 15400.00, hours: 30.8, status: 'Sent', dueDate: '2026-04-25', matterRef: 'AeroVista — Patent Troll Defense' },
  { invoiceNumber: 'INV-2026-0314', clientName: 'Margaret Holloway', amount: 12300.00, hours: 24.6, status: 'Sent', dueDate: '2026-04-10', matterRef: 'Holloway v. Pinnacle Technologies' },
  { invoiceNumber: 'INV-2026-0315', clientName: 'Apex Ventures LLC', amount: 18500.00, hours: 37.0, status: 'Sent', dueDate: '2026-04-30', matterRef: 'Apex Ventures — Fund IV Formation' },

  // ─── 20 Paid invoices ──────────────────────────────────────────────────
  { invoiceNumber: 'INV-2026-0201', clientName: 'Pinnacle Technologies Inc', amount: 9800.00, hours: 19.6, status: 'Paid', dueDate: '2026-03-01', matterRef: 'Pinnacle Tech — Board Governance Review' },
  { invoiceNumber: 'INV-2026-0202', clientName: 'Atlas Freight Systems', amount: 14200.00, hours: 28.4, status: 'Paid', dueDate: '2026-03-05', matterRef: 'Atlas Freight — Interstate Compliance' },
  { invoiceNumber: 'INV-2026-0203', clientName: 'Greenfield Organics Corp', amount: 6500.00, hours: 13.0, status: 'Paid', dueDate: '2026-02-15', matterRef: 'Greenfield Organics — FDA Compliance' },
  { invoiceNumber: 'INV-2026-0204', clientName: 'Dr. Elena Vasquez', amount: 22400.00, hours: 44.8, status: 'Paid', dueDate: '2026-02-01', matterRef: 'Vasquez — Medical Malpractice Settlement' },
  { invoiceNumber: 'INV-2026-0205', clientName: 'Angela Foster', amount: 8750.00, hours: 17.5, status: 'Paid', dueDate: '2026-02-10', matterRef: 'Foster — Unlawful Eviction' },
  { invoiceNumber: 'INV-2026-0206', clientName: 'Cascade Energy Solutions', amount: 18900.00, hours: 37.8, status: 'Paid', dueDate: '2026-01-20', matterRef: 'Cascade Energy — Series B Financing' },
  { invoiceNumber: 'INV-2026-0207', clientName: 'Janet & William Crawford', amount: 4200.00, hours: 8.4, status: 'Paid', dueDate: '2026-02-28', matterRef: 'Crawford — Boundary Dispute' },
  { invoiceNumber: 'INV-2026-0208', clientName: 'Forte Game Studios', amount: 15600.00, hours: 31.2, status: 'Paid', dueDate: '2026-03-15', matterRef: 'Forte Games — Merchandising IP' },
  { invoiceNumber: 'INV-2026-0209', clientName: 'Pacific Rim Trading Co', amount: 11400.00, hours: 22.8, status: 'Paid', dueDate: '2026-01-30', matterRef: 'Pacific Rim — Trade Compliance' },
  { invoiceNumber: 'INV-2026-0210', clientName: 'Anthony DiNapoli', amount: 38500.00, hours: 77.0, status: 'Paid', dueDate: '2026-02-20', matterRef: 'DiNapoli — Wrongful Death Settlement' },
  { invoiceNumber: 'INV-2026-0211', clientName: 'BlueWave Digital Agency', amount: 5800.00, hours: 11.6, status: 'Paid', dueDate: '2026-01-15', matterRef: 'BlueWave — Operating Agreement' },
  { invoiceNumber: 'INV-2026-0212', clientName: 'Centennial Bank & Trust', amount: 21300.00, hours: 42.6, status: 'Paid', dueDate: '2026-02-28', matterRef: 'Centennial Bank — Fintech Partnership' },
  { invoiceNumber: 'INV-2026-0213', clientName: 'Ryan Mitchell', amount: 7200.00, hours: 14.4, status: 'Paid', dueDate: '2026-01-10', matterRef: 'Mitchell — DUI Defense' },
  { invoiceNumber: 'INV-2026-0214', clientName: 'Bayshore Condominium Assoc', amount: 12800.00, hours: 25.6, status: 'Paid', dueDate: '2026-03-01', matterRef: 'Bayshore Condo — Construction Defect' },
  { invoiceNumber: 'INV-2026-0215', clientName: 'Coastal Marine Services', amount: 9400.00, hours: 18.8, status: 'Paid', dueDate: '2026-02-15', matterRef: 'Coastal Marine — Vessel Chartering' },
  { invoiceNumber: 'INV-2026-0216', clientName: 'Precision Auto Group', amount: 16700.00, hours: 33.4, status: 'Paid', dueDate: '2026-01-25', matterRef: 'Precision Auto — Consumer Fraud Defense' },
  { invoiceNumber: 'INV-2026-0217', clientName: 'Keystone Data Systems', amount: 19500.00, hours: 39.0, status: 'Paid', dueDate: '2026-03-10', matterRef: 'Keystone — Privacy Compliance' },
  { invoiceNumber: 'INV-2026-0218', clientName: 'Dr. Sarah Kessler', amount: 8100.00, hours: 16.2, status: 'Paid', dueDate: '2026-01-20', matterRef: 'Kessler — Drug Delivery Patent' },
  { invoiceNumber: 'INV-2026-0219', clientName: 'Vanguard Construction Group', amount: 13600.00, hours: 27.2, status: 'Paid', dueDate: '2026-03-15', matterRef: 'Vanguard — Government Contract Review' },
  { invoiceNumber: 'INV-2026-0220', clientName: 'Lakeside Brewing Company', amount: 7300.00, hours: 14.6, status: 'Paid', dueDate: '2026-02-05', matterRef: 'Lakeside — TTB Licensing' },

  // ─── 7 Overdue invoices ────────────────────────────────────────────────
  { invoiceNumber: 'INV-2026-0101', clientName: 'Rodriguez Construction LLC', amount: 15800.00, hours: 31.6, status: 'Overdue', dueDate: '2026-02-15', matterRef: 'Greenfield Properties v. Rodriguez Construction' },
  { invoiceNumber: 'INV-2026-0102', clientName: 'Sunrise Bakery Group', amount: 9200.00, hours: 18.4, status: 'Overdue', dueDate: '2026-02-28', matterRef: 'Sunrise Bakery v. FranchiseCo International' },
  { invoiceNumber: 'INV-2026-0103', clientName: 'Michael O\'Brien', amount: 6400.00, hours: 12.8, status: 'Overdue', dueDate: '2026-03-01', matterRef: 'O\'Brien v. Metro Construction Corp' },
  { invoiceNumber: 'INV-2026-0104', clientName: 'Artisan Coffee Brands', amount: 11300.00, hours: 22.6, status: 'Overdue', dueDate: '2026-02-20', matterRef: 'Artisan Coffee — Trademark Opposition' },
  { invoiceNumber: 'INV-2026-0105', clientName: 'GlobalTech Solutions', amount: 18900.00, hours: 37.8, status: 'Overdue', dueDate: '2026-03-05', matterRef: 'GlobalTech v. DataServ Solutions' },
  { invoiceNumber: 'INV-2026-0106', clientName: 'James Fitzgerald', amount: 7800.00, hours: 15.6, status: 'Overdue', dueDate: '2026-02-10', matterRef: 'Fitzgerald v. Doe (Defamation)' },
  { invoiceNumber: 'INV-2026-0107', clientName: 'David & Susan Park', amount: 10500.00, hours: 21.0, status: 'Overdue', dueDate: '2026-03-10', matterRef: 'Park v. HomeComfort Appliances' },
];

function getGroupForStatus(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Draft'];
}

export async function seedInvoices(
  ctx: JurisPathContext,
  board: BoardContext
): Promise<void> {
  console.log(`[JurisPath] Seeding ${INVOICES.length} invoices...`);

  for (let i = 0; i < INVOICES.length; i++) {
    const inv = INVOICES[i];
    const groupId = getGroupForStatus(inv.status, board.groups);
    const billingAttorney = ctx.allAttorneyIds[i % ctx.allAttorneyIds.length];

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: `${inv.invoiceNumber} — ${inv.clientName}`,
      position: i,
      createdBy: ctx.billingManagerId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Invoice Number'], value: inv.invoiceNumber },
      { itemId: item.id, columnId: board.columns['Client'], value: inv.clientName },
      { itemId: item.id, columnId: board.columns['Amount'], value: inv.amount },
      { itemId: item.id, columnId: board.columns['Hours'], value: inv.hours },
      { itemId: item.id, columnId: board.columns['Status'], value: inv.status },
      { itemId: item.id, columnId: board.columns['Due Date'], value: inv.dueDate },
      { itemId: item.id, columnId: board.columns['Matter Reference'], value: inv.matterRef },
      { itemId: item.id, columnId: board.columns['Billing Attorney'], value: billingAttorney },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[JurisPath] Seeded ${INVOICES.length} invoices`);
}
