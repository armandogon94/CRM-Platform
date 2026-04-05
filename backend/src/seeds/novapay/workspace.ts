import bcrypt from 'bcryptjs';
import { Workspace, User } from '../../models';

export interface NovaPayContext {
  workspaceId: number;
  adminId: number;
  managerId: number;
  analystId: number;
  ceoId: number;
  userId: number;
  viewerId: number;
  complianceOfficerId: number;
  riskAnalystId: number;
}

const NOVAPAY_USERS = [
  { email: 'admin@novapay.com', firstName: 'Sarah', lastName: 'Chen', role: 'admin' as const },
  { email: 'ceo@novapay.com', firstName: 'Marcus', lastName: 'Rivera', role: 'admin' as const },
  { email: 'manager@novapay.com', firstName: 'James', lastName: 'Park', role: 'member' as const },
  { email: 'analyst@novapay.com', firstName: 'Priya', lastName: 'Sharma', role: 'member' as const },
  { email: 'user@novapay.com', firstName: 'Alex', lastName: 'Thompson', role: 'member' as const },
  { email: 'viewer@novapay.com', firstName: 'Emily', lastName: 'Nakamura', role: 'viewer' as const },
  { email: 'compliance@novapay.com', firstName: 'David', lastName: 'Okafor', role: 'member' as const },
  { email: 'risk@novapay.com', firstName: 'Lisa', lastName: 'Gonzalez', role: 'member' as const },
];

export async function seedNovaPayWorkspace(): Promise<NovaPayContext> {
  console.log('[NovaPay] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'NovaPay Demo',
    slug: 'novapay',
    description: 'Digital payment processing & FinTech CRM workspace',
    settings: {
      brandColor: '#2563EB',
      secondaryColor: '#1E40AF',
      accentColor: '#60A5FA',
      industry: 'fintech',
      tagline: 'Moving Money Forward',
      logo: '/assets/novapay-logo.svg',
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of NOVAPAY_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[NovaPay] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    ceoId: users[1].id,
    managerId: users[2].id,
    analystId: users[3].id,
    userId: users[4].id,
    viewerId: users[5].id,
    complianceOfficerId: users[6].id,
    riskAnalystId: users[7].id,
  };
}
