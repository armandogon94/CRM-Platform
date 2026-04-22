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

export interface NovaPayE2eFixtureContext {
  workspaceId: number;
  e2eUserId: number;
}

/**
 * E2E fixture credentials — exported for reuse by Playwright setup and the
 * Status=Flagged automation seeder (Task B2).
 *
 * Slice 19 (Spec §Test data strategy): a dedicated workspace flagged
 * `isE2eFixture = true` isolates the reset surface from the main NovaPay demo.
 */
export const NOVAPAY_E2E_EMAIL = 'e2e@novapay.test';
export const NOVAPAY_E2E_PASSWORD = 'e2epassword';
export const NOVAPAY_E2E_WORKSPACE_SLUG = 'novapay-e2e';

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

/**
 * Seeds the NovaPay E2E fixture workspace and its admin user.
 *
 * Idempotent by design: the fixture workspace is keyed on a unique slug, so
 * repeated invocations (`seed` twice, or `E2EResetService.reset()` with a
 * reseed callback) result in exactly one fixture workspace and one E2E user.
 *
 * Returns the IDs even when the rows already existed, so downstream seeders
 * (e.g., Task B2's Status=Flagged automation) can target them.
 */
export async function seedNovaPayE2eFixture(): Promise<NovaPayE2eFixtureContext> {
  console.log('[NovaPay] Seeding E2E fixture workspace and user...');

  const [workspace] = await Workspace.findOrCreate({
    where: { slug: NOVAPAY_E2E_WORKSPACE_SLUG },
    defaults: {
      name: 'NovaPay E2E Fixture',
      slug: NOVAPAY_E2E_WORKSPACE_SLUG,
      description: 'Isolated workspace reset between Playwright runs (Slice 19).',
      settings: {
        brandColor: '#2563EB',
        industry: 'fintech',
        isE2eFixture: true,
      },
      isE2eFixture: true,
    },
  });

  // Defensive: if a pre-existing row was returned by slug but the flag drifted,
  // force it back to true so the E2E reset path always finds it.
  if (!workspace.isE2eFixture) {
    await Workspace.update(
      { isE2eFixture: true },
      { where: { id: workspace.id } }
    );
    workspace.isE2eFixture = true;
  }

  const passwordHash = await bcrypt.hash(NOVAPAY_E2E_PASSWORD, 12);

  const [e2eUser] = await User.findOrCreate({
    where: { email: NOVAPAY_E2E_EMAIL },
    defaults: {
      email: NOVAPAY_E2E_EMAIL,
      passwordHash,
      firstName: 'E2E',
      lastName: 'Tester',
      role: 'admin',
      workspaceId: workspace.id,
      isActive: true,
    },
  });

  // Anchor workspace ownership to the fixture user (only if unset).
  if (workspace.createdBy == null) {
    await Workspace.update({ createdBy: e2eUser.id }, { where: { id: workspace.id } });
  }

  console.log(
    `[NovaPay] E2E fixture ready (workspaceId=${workspace.id}, userId=${e2eUser.id})`
  );

  return { workspaceId: workspace.id, e2eUserId: e2eUser.id };
}
