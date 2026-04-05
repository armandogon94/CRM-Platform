import bcrypt from 'bcryptjs';
import { Workspace, User } from '../../models';

export interface TableSyncContext {
  workspaceId: number;
  adminId: number;
  gmId: number;
  hostManagerId: number;
  headChefId: number;
  sousChefId: number;
  barManagerId: number;
  serverLeadId: number;
  eventCoordinatorId: number;
  userId: number;
  viewerId: number;
}

const TABLESYNC_USERS = [
  { email: 'admin@tablesync.com', firstName: 'Marco', lastName: 'DeLuca', role: 'admin' as const },
  { email: 'gm@tablesync.com', firstName: 'Sofia', lastName: 'Ramirez', role: 'admin' as const },
  { email: 'host@tablesync.com', firstName: 'Aiden', lastName: 'Park', role: 'member' as const },
  { email: 'chef@tablesync.com', firstName: 'Isabella', lastName: 'Moretti', role: 'member' as const },
  { email: 'souschef@tablesync.com', firstName: 'Kenji', lastName: 'Tanaka', role: 'member' as const },
  { email: 'bar@tablesync.com', firstName: 'Olivia', lastName: 'Chen', role: 'member' as const },
  { email: 'serverlead@tablesync.com', firstName: 'Daniel', lastName: 'Okafor', role: 'member' as const },
  { email: 'events@tablesync.com', firstName: 'Carmen', lastName: 'Vasquez', role: 'member' as const },
  { email: 'staff@tablesync.com', firstName: 'Liam', lastName: 'Torres', role: 'member' as const },
  { email: 'viewer@tablesync.com', firstName: 'Natalie', lastName: 'Kim', role: 'viewer' as const },
];

export async function seedTableSyncWorkspace(): Promise<TableSyncContext> {
  console.log('[TableSync] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'TableSync Demo',
    slug: 'tablesync',
    description: 'Restaurant reservation, menu, and staff management CRM workspace',
    settings: {
      brandColor: '#9F1239',
      secondaryColor: '#881337',
      accentColor: '#FB7185',
      industry: 'hospitality',
      tagline: 'Every Seat, Perfectly Timed',
      logo: '/assets/tablesync-logo.svg',
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of TABLESYNC_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[TableSync] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    gmId: users[1].id,
    hostManagerId: users[2].id,
    headChefId: users[3].id,
    sousChefId: users[4].id,
    barManagerId: users[5].id,
    serverLeadId: users[6].id,
    eventCoordinatorId: users[7].id,
    userId: users[8].id,
    viewerId: users[9].id,
  };
}
