import bcrypt from 'bcryptjs';
import Workspace from '../../models/Workspace';
import User from '../../models/User';

export interface UrbanNestContext {
  workspaceId: number;
  adminId: number;
  brokerId: number;
  agentIds: number[];
  coordinatorId: number;
  viewerId: number;
}

const URBANNEST_USERS = [
  // Leadership & Admin
  { email: 'admin@urbannest.com', firstName: 'Rachel', lastName: 'Thornton', role: 'admin' as const },
  { email: 'broker@urbannest.com', firstName: 'David', lastName: 'Castillo', role: 'admin' as const },
  // Agents
  { email: 'sarah.agent@urbannest.com', firstName: 'Sarah', lastName: 'Kim', role: 'member' as const },
  { email: 'marcus.agent@urbannest.com', firstName: 'Marcus', lastName: 'Johnson', role: 'member' as const },
  { email: 'elena.agent@urbannest.com', firstName: 'Elena', lastName: 'Rodriguez', role: 'member' as const },
  { email: 'james.agent@urbannest.com', firstName: 'James', lastName: 'Patel', role: 'member' as const },
  { email: 'olivia.agent@urbannest.com', firstName: 'Olivia', lastName: 'Chen', role: 'member' as const },
  { email: 'nathan.agent@urbannest.com', firstName: 'Nathan', lastName: 'Brooks', role: 'member' as const },
  // Transaction coordinator
  { email: 'coordinator@urbannest.com', firstName: 'Amy', lastName: 'Nguyen', role: 'member' as const },
  // Viewer
  { email: 'viewer@urbannest.com', firstName: 'Guest', lastName: 'Viewer', role: 'viewer' as const },
];

export async function seedUrbanNestWorkspace(): Promise<UrbanNestContext> {
  console.log('[UrbanNest] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'UrbanNest Realty',
    slug: 'urbannest',
    description: 'Residential real estate — sales, leasing, and property management CRM',
    settings: {
      brandColor: '#D97706',
      secondaryColor: '#B45309',
      accentColor: '#FBBF24',
      surfaceColor: '#FFFBEB',
      industry: 'real_estate',
      tagline: 'Find Your Place',
      logo: '/assets/urbannest-logo.svg',
      modules: ['leads', 'listings', 'showings', 'deals'],
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of URBANNEST_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[UrbanNest] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    brokerId: users[1].id,
    agentIds: [users[2].id, users[3].id, users[4].id, users[5].id, users[6].id, users[7].id],
    coordinatorId: users[8].id,
    viewerId: users[9].id,
  };
}
