import bcrypt from 'bcryptjs';
import Workspace from '../../models/Workspace';
import User from '../../models/User';

export interface EduPulseContext {
  workspaceId: number;
  adminId: number;
  principalId: number;
  deanId: number;
  counselorId: number;
  teacherIds: number[];
  registrarId: number;
  viewerId: number;
}

const EDUPULSE_USERS = [
  // Leadership & Admin
  { email: 'admin@edupulse.com', firstName: 'Dr. Karen', lastName: 'Whitfield', role: 'admin' as const },
  { email: 'principal@edupulse.com', firstName: 'Dr. Marcus', lastName: 'Thompson', role: 'admin' as const },
  // Academic Leadership
  { email: 'dean@edupulse.com', firstName: 'Dr. Priya', lastName: 'Sharma', role: 'member' as const },
  { email: 'counselor@edupulse.com', firstName: 'Angela', lastName: 'Reeves', role: 'member' as const },
  // Teachers (6)
  { email: 'teacher1@edupulse.com', firstName: 'Robert', lastName: 'Chen', role: 'member' as const },
  { email: 'teacher2@edupulse.com', firstName: 'Maria', lastName: 'Gonzalez', role: 'member' as const },
  { email: 'teacher3@edupulse.com', firstName: 'James', lastName: 'Okafor', role: 'member' as const },
  { email: 'teacher4@edupulse.com', firstName: 'Sarah', lastName: 'Kim', role: 'member' as const },
  { email: 'teacher5@edupulse.com', firstName: 'David', lastName: 'Petrov', role: 'member' as const },
  { email: 'teacher6@edupulse.com', firstName: 'Emily', lastName: 'Nakamura', role: 'member' as const },
  // Registrar
  { email: 'registrar@edupulse.com', firstName: 'Thomas', lastName: 'Williams', role: 'member' as const },
  // Viewer
  { email: 'viewer@edupulse.com', firstName: 'Linda', lastName: 'Foster', role: 'viewer' as const },
];

export async function seedEduPulseWorkspace(): Promise<EduPulseContext> {
  console.log('[EduPulse] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'EduPulse',
    slug: 'edupulse',
    description: 'Education platform CRM — Student enrollment, course management & academic tracking',
    settings: {
      brandColor: '#6D28D9',
      secondaryColor: '#7C3AED',
      accentColor: '#A78BFA',
      surfaceColor: '#F5F3FF',
      industry: 'education',
      tagline: 'Inspire. Educate. Empower.',
      logo: '/assets/edupulse-logo.svg',
      modules: ['enrollment', 'courses', 'assignments', 'grading'],
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of EDUPULSE_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[EduPulse] Created workspace (id=${workspace.id}) with ${users.length} users`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    principalId: users[1].id,
    deanId: users[2].id,
    counselorId: users[3].id,
    teacherIds: [users[4].id, users[5].id, users[6].id, users[7].id, users[8].id, users[9].id],
    registrarId: users[10].id,
    viewerId: users[11].id,
  };
}
