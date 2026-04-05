import bcrypt from 'bcryptjs';
import Workspace from '../../models/Workspace';
import User from '../../models/User';

export interface TrustGuardContext {
  workspaceId: number;
  adminId: number;
  claimsManagerId: number;
  seniorUnderwriterId: number;
  underwriterIds: number[];
  adjusterIds: number[];
  agentIds: number[];
  viewerId: number;
}

const TRUSTGUARD_USERS = [
  // Leadership & Admin
  { email: 'admin@trustguard.com', firstName: 'Catherine', lastName: 'Morales', role: 'admin' as const },
  { email: 'ceo@trustguard.com', firstName: 'Robert', lastName: 'Whitfield', role: 'admin' as const },
  // Claims Department
  { email: 'claims.manager@trustguard.com', firstName: 'Derek', lastName: 'Santiago', role: 'member' as const },
  { email: 'adjuster1@trustguard.com', firstName: 'Karen', lastName: 'Liu', role: 'member' as const },
  { email: 'adjuster2@trustguard.com', firstName: 'Marcus', lastName: 'Obi', role: 'member' as const },
  { email: 'adjuster3@trustguard.com', firstName: 'Tamara', lastName: 'Novak', role: 'member' as const },
  { email: 'adjuster4@trustguard.com', firstName: 'Raj', lastName: 'Mehta', role: 'member' as const },
  { email: 'adjuster5@trustguard.com', firstName: 'Angela', lastName: 'Frey', role: 'member' as const },
  // Underwriting Department
  { email: 'sr.underwriter@trustguard.com', firstName: 'William', lastName: 'Tanaka', role: 'member' as const },
  { email: 'underwriter1@trustguard.com', firstName: 'Jessica', lastName: 'Park', role: 'member' as const },
  { email: 'underwriter2@trustguard.com', firstName: 'Nathaniel', lastName: 'Brooks', role: 'member' as const },
  { email: 'underwriter3@trustguard.com', firstName: 'Sophia', lastName: 'Guerrero', role: 'member' as const },
  { email: 'underwriter4@trustguard.com', firstName: 'Ahmed', lastName: 'Hassan', role: 'member' as const },
  // Sales / Agents
  { email: 'agent1@trustguard.com', firstName: 'Linda', lastName: 'Chambers', role: 'member' as const },
  { email: 'agent2@trustguard.com', firstName: 'Brian', lastName: 'Kowalski', role: 'member' as const },
  { email: 'agent3@trustguard.com', firstName: 'Diana', lastName: 'Ross-Chen', role: 'member' as const },
  { email: 'agent4@trustguard.com', firstName: 'Kevin', lastName: 'Yamamoto', role: 'member' as const },
  { email: 'agent5@trustguard.com', firstName: 'Priya', lastName: 'Nair', role: 'member' as const },
  { email: 'agent6@trustguard.com', firstName: 'Thomas', lastName: 'Adebayo', role: 'member' as const },
  // Viewer
  { email: 'viewer@trustguard.com', firstName: 'Emily', lastName: 'Carter', role: 'viewer' as const },
];

export async function seedTrustGuardWorkspace(): Promise<TrustGuardContext> {
  console.log('[TrustGuard] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'TrustGuard Insurance',
    slug: 'trustguard',
    description: 'Insurance CRM — Auto, Home, Life & Commercial policy management',
    settings: {
      brandColor: '#1E3A5F',
      secondaryColor: '#2D5F8A',
      accentColor: '#4A90D9',
      surfaceColor: '#F0F4F8',
      industry: 'insurance',
      tagline: 'Protection You Can Trust',
      logo: '/assets/trustguard-logo.svg',
      modules: ['claims', 'policies', 'underwriting', 'prospects'],
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of TRUSTGUARD_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[TrustGuard] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    claimsManagerId: users[2].id,
    seniorUnderwriterId: users[8].id,
    adjusterIds: [users[3].id, users[4].id, users[5].id, users[6].id, users[7].id],
    underwriterIds: [users[9].id, users[10].id, users[11].id, users[12].id],
    agentIds: [users[13].id, users[14].id, users[15].id, users[16].id, users[17].id, users[18].id],
    viewerId: users[19].id,
  };
}
