import bcrypt from 'bcryptjs';
import Workspace from '../../models/Workspace';
import User from '../../models/User';

export interface DentaFlowContext {
  workspaceId: number;
  adminId: number;
  officeManagerId: number;
  dentistIds: number[];
  hygienistIds: number[];
  frontDeskId: number;
  viewerId: number;
}

const DENTAFLOW_USERS = [
  // Leadership & Admin
  { email: 'admin@dentaflow.com', firstName: 'Dr. Patricia', lastName: 'Nguyen', role: 'admin' as const },
  { email: 'office.manager@dentaflow.com', firstName: 'Rebecca', lastName: 'Torres', role: 'admin' as const },
  // Dentists (6)
  { email: 'dr.chen@dentaflow.com', firstName: 'Dr. Michael', lastName: 'Chen', role: 'member' as const },
  { email: 'dr.okafor@dentaflow.com', firstName: 'Dr. Amara', lastName: 'Okafor', role: 'member' as const },
  { email: 'dr.petrov@dentaflow.com', firstName: 'Dr. Alexei', lastName: 'Petrov', role: 'member' as const },
  { email: 'dr.martinez@dentaflow.com', firstName: 'Dr. Sofia', lastName: 'Martinez', role: 'member' as const },
  { email: 'dr.kim@dentaflow.com', firstName: 'Dr. Jason', lastName: 'Kim', role: 'member' as const },
  { email: 'dr.brooks@dentaflow.com', firstName: 'Dr. Lauren', lastName: 'Brooks', role: 'member' as const },
  // Hygienists (2)
  { email: 'hygienist1@dentaflow.com', firstName: 'Maria', lastName: 'Santos', role: 'member' as const },
  { email: 'hygienist2@dentaflow.com', firstName: 'David', lastName: 'Johansson', role: 'member' as const },
  // Front Desk
  { email: 'frontdesk@dentaflow.com', firstName: 'Ashley', lastName: 'Williams', role: 'member' as const },
  // Viewer
  { email: 'viewer@dentaflow.com', firstName: 'Karen', lastName: 'Liu', role: 'viewer' as const },
];

export async function seedDentaFlowWorkspace(): Promise<DentaFlowContext> {
  console.log('[DentaFlow] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'DentaFlow Dental Clinic',
    slug: 'dentaflow',
    description: 'Dental clinic CRM — General Dentistry, Orthodontics & Oral Surgery management',
    settings: {
      brandColor: '#06B6D4',
      secondaryColor: '#0891B2',
      accentColor: '#22D3EE',
      surfaceColor: '#ECFEFF',
      industry: 'dental',
      tagline: 'Smiles You Can Trust',
      logo: '/assets/dentaflow-logo.svg',
      modules: ['patients', 'appointments', 'treatments', 'billing'],
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of DENTAFLOW_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[DentaFlow] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    officeManagerId: users[1].id,
    dentistIds: [users[2].id, users[3].id, users[4].id, users[5].id, users[6].id, users[7].id],
    hygienistIds: [users[8].id, users[9].id],
    frontDeskId: users[10].id,
    viewerId: users[11].id,
  };
}
