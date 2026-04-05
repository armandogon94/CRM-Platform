import bcrypt from 'bcryptjs';
import Workspace from '../../models/Workspace';
import User from '../../models/User';

export interface MedVistaContext {
  workspaceId: number;
  adminId: number;
  billingId: number;
  providerIds: number[];
}

const MEDVISTA_USERS = [
  // 12 Providers (member role)
  { email: 'robert.chen@medvista.com', firstName: 'Robert', lastName: 'Chen', role: 'member' as const },
  { email: 'maria.santos@medvista.com', firstName: 'Maria', lastName: 'Santos', role: 'member' as const },
  { email: 'james.wilson@medvista.com', firstName: 'James', lastName: 'Wilson', role: 'member' as const },
  { email: 'aisha.patel@medvista.com', firstName: 'Aisha', lastName: 'Patel', role: 'member' as const },
  { email: 'sarah.kim@medvista.com', firstName: 'Sarah', lastName: 'Kim', role: 'member' as const },
  { email: 'michael.brown@medvista.com', firstName: 'Michael', lastName: 'Brown', role: 'member' as const },
  { email: 'lisa.rodriguez@medvista.com', firstName: 'Lisa', lastName: 'Rodriguez', role: 'member' as const },
  { email: 'david.nguyen@medvista.com', firstName: 'David', lastName: 'Nguyen', role: 'member' as const },
  { email: 'jennifer.taylor@medvista.com', firstName: 'Jennifer', lastName: 'Taylor', role: 'member' as const },
  { email: 'andrew.johnson@medvista.com', firstName: 'Andrew', lastName: 'Johnson', role: 'member' as const },
  { email: 'rachel.martinez@medvista.com', firstName: 'Rachel', lastName: 'Martinez', role: 'member' as const },
  { email: 'kevin.lee@medvista.com', firstName: 'Kevin', lastName: 'Lee', role: 'member' as const },
  // 2 Admin staff
  { email: 'admin@medvista.com', firstName: 'Amanda', lastName: 'Foster', role: 'admin' as const },
  { email: 'billing@medvista.com', firstName: 'Carlos', lastName: 'Reyes', role: 'member' as const },
];

export async function seedMedVistaWorkspace(): Promise<MedVistaContext> {
  console.log('[MedVista] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'MedVista Healthcare',
    slug: 'medvista',
    description: 'Multi-specialty medical group CRM workspace',
    settings: {
      brandColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#34D399',
      industry: 'healthcare',
      tagline: 'Multi-Specialty Medical Group',
      logo: '/assets/medvista-logo.svg',
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of MEDVISTA_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[12].id }, { where: { id: workspace.id } });

  console.log(`[MedVista] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[12].id,
    billingId: users[13].id,
    providerIds: users.slice(0, 12).map((u) => u.id),
  };
}
