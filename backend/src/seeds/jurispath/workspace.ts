import bcrypt from 'bcryptjs';
import { Workspace, User } from '../../models';

export interface JurisPathContext {
  workspaceId: number;
  adminId: number;
  managingPartnerId: number;
  // Partners
  partnerIds: number[];
  // Senior Associates
  seniorAssociateIds: number[];
  // Associates
  associateIds: number[];
  // Support
  paralegalId: number;
  billingManagerId: number;
  viewerId: number;
  // Convenience aliases
  allAttorneyIds: number[];
}

const JURISPATH_USERS = [
  // Admin & Leadership
  { email: 'admin@jurispath.com', firstName: 'Victoria', lastName: 'Harrington', role: 'admin' as const },
  { email: 'managing.partner@jurispath.com', firstName: 'Robert', lastName: 'Caldwell', role: 'admin' as const },

  // Partners (5)
  { email: 'e.montague@jurispath.com', firstName: 'Eleanor', lastName: 'Montague', role: 'member' as const },
  { email: 'j.nakamura@jurispath.com', firstName: 'James', lastName: 'Nakamura', role: 'member' as const },
  { email: 's.okafor@jurispath.com', firstName: 'Samuel', lastName: 'Okafor', role: 'member' as const },
  { email: 'd.reyes@jurispath.com', firstName: 'Diana', lastName: 'Reyes', role: 'member' as const },
  { email: 'm.chen@jurispath.com', firstName: 'Michael', lastName: 'Chen', role: 'member' as const },

  // Senior Associates (10)
  { email: 'a.petrov@jurispath.com', firstName: 'Alexei', lastName: 'Petrov', role: 'member' as const },
  { email: 'l.washington@jurispath.com', firstName: 'Lauren', lastName: 'Washington', role: 'member' as const },
  { email: 'k.tanaka@jurispath.com', firstName: 'Kenji', lastName: 'Tanaka', role: 'member' as const },
  { email: 'n.oconnor@jurispath.com', firstName: 'Niamh', lastName: "O'Connor", role: 'member' as const },
  { email: 'r.gupta@jurispath.com', firstName: 'Raj', lastName: 'Gupta', role: 'member' as const },
  { email: 'c.dubois@jurispath.com', firstName: 'Claire', lastName: 'Dubois', role: 'member' as const },
  { email: 'h.kim@jurispath.com', firstName: 'Hannah', lastName: 'Kim', role: 'member' as const },
  { email: 't.morales@jurispath.com', firstName: 'Tomas', lastName: 'Morales', role: 'member' as const },
  { email: 'f.hassan@jurispath.com', firstName: 'Fatima', lastName: 'Hassan', role: 'member' as const },
  { email: 'b.steiner@jurispath.com', firstName: 'Benjamin', lastName: 'Steiner', role: 'member' as const },

  // Associates (8)
  { email: 'j.martinez@jurispath.com', firstName: 'Julia', lastName: 'Martinez', role: 'member' as const },
  { email: 'e.wright@jurispath.com', firstName: 'Ethan', lastName: 'Wright', role: 'member' as const },
  { email: 'a.singh@jurispath.com', firstName: 'Ananya', lastName: 'Singh', role: 'member' as const },
  { email: 'p.novak@jurispath.com', firstName: 'Pavel', lastName: 'Novak', role: 'member' as const },
  { email: 's.blake@jurispath.com', firstName: 'Sarah', lastName: 'Blake', role: 'member' as const },
  { email: 'd.lee@jurispath.com', firstName: 'Daniel', lastName: 'Lee', role: 'member' as const },
  { email: 'o.torres@jurispath.com', firstName: 'Olivia', lastName: 'Torres', role: 'member' as const },
  { email: 'w.park@jurispath.com', firstName: 'William', lastName: 'Park', role: 'member' as const },

  // Support Staff
  { email: 'paralegal@jurispath.com', firstName: 'Grace', lastName: 'Mitchell', role: 'member' as const },
  { email: 'billing@jurispath.com', firstName: 'Marcus', lastName: 'Rivera', role: 'member' as const },
  { email: 'viewer@jurispath.com', firstName: 'Guest', lastName: 'Viewer', role: 'viewer' as const },
];

export async function seedJurisPathWorkspace(): Promise<JurisPathContext> {
  console.log('[JurisPath] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'JurisPath Legal',
    slug: 'jurispath',
    description: 'Full-service legal firm — Litigation, Corporate, IP, and Family Law',
    settings: {
      brandColor: '#166534',
      secondaryColor: '#14532D',
      accentColor: '#4ADE80',
      industry: 'legal',
      tagline: 'Precision in Practice',
      logo: '/assets/jurispath-logo.svg',
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of JURISPATH_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  const partnerIds = users.slice(2, 7).map(u => u.id);
  const seniorAssociateIds = users.slice(7, 17).map(u => u.id);
  const associateIds = users.slice(17, 25).map(u => u.id);
  const allAttorneyIds = [...partnerIds, ...seniorAssociateIds, ...associateIds];

  console.log(`[JurisPath] Created workspace (id=${workspace.id}) with ${users.length} users (25 attorneys)`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    managingPartnerId: users[1].id,
    partnerIds,
    seniorAssociateIds,
    associateIds,
    paralegalId: users[25].id,
    billingManagerId: users[26].id,
    viewerId: users[27].id,
    allAttorneyIds,
  };
}
