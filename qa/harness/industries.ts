/**
 * Industry registry — source of truth for the QA harness (Slice 19.7).
 *
 * Each entry describes everything the harness needs to log in and make
 * sensible assertions about an industry's seeded demo data: frontend port,
 * backend service name, admin credentials, expected headline board name,
 * and brand primary color (hex, lowercase).
 */

export interface IndustrySpec {
  slug: string;
  company: string;
  port: number;
  frontendService: string;
  adminEmail: string;
  adminPassword: string;
  /**
   * The first / anchor board we expect every industry to have. Used as the
   * "primary board" target for Tier-1 navigation + Tier-2 item creation.
   */
  expectedPrimaryBoard: string;
  /** Primary brand color from INDUSTRY_THEMES, normalised to lowercase hex. */
  brandColor: string;
  /** Seed npm script inside the backend container. */
  seedScript: string;
}

export const INDUSTRIES: IndustrySpec[] = [
  {
    slug: 'novapay',
    company: 'NovaPay',
    port: 13001,
    frontendService: 'novapay-frontend',
    adminEmail: 'admin@novapay.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Transaction Pipeline',
    brandColor: '#2563eb',
    seedScript: 'seed:novapay',
  },
  {
    slug: 'medvista',
    company: 'MedVista',
    port: 13002,
    frontendService: 'medvista-frontend',
    adminEmail: 'admin@medvista.com',
    adminPassword: 'demo123',
    // Healthcare: patient management or appointments — verified in setup step
    expectedPrimaryBoard: 'Patient Records',
    brandColor: '#059669',
    seedScript: 'seed:medvista',
  },
  {
    slug: 'trustguard',
    company: 'TrustGuard',
    port: 13003,
    frontendService: 'trustguard-frontend',
    adminEmail: 'admin@trustguard.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Policies',
    brandColor: '#1e3a5f',
    seedScript: 'seed:trustguard',
  },
  {
    slug: 'urbannest',
    company: 'UrbanNest',
    port: 13004,
    frontendService: 'urbannest-frontend',
    adminEmail: 'admin@urbannest.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Listings',
    brandColor: '#d97706',
    seedScript: 'seed:urbannest',
  },
  {
    slug: 'swiftroute',
    company: 'SwiftRoute',
    port: 13005,
    frontendService: 'swiftroute-frontend',
    adminEmail: 'admin@swiftroute.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Shipments',
    brandColor: '#7c3aed',
    seedScript: 'seed:swiftroute',
  },
  {
    slug: 'dentaflow',
    company: 'DentaFlow',
    port: 13006,
    frontendService: 'dentaflow-frontend',
    adminEmail: 'admin@dentaflow.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Appointments',
    brandColor: '#06b6d4',
    seedScript: 'seed:dentaflow',
  },
  {
    slug: 'jurispath',
    company: 'JurisPath',
    port: 13007,
    frontendService: 'jurispath-frontend',
    adminEmail: 'admin@jurispath.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Cases',
    brandColor: '#166534',
    seedScript: 'seed:jurispath',
  },
  {
    slug: 'tablesync',
    company: 'TableSync',
    port: 13008,
    frontendService: 'tablesync-frontend',
    adminEmail: 'admin@tablesync.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Reservations',
    brandColor: '#9f1239',
    seedScript: 'seed:tablesync',
  },
  {
    slug: 'cranestack',
    company: 'CraneStack',
    port: 13009,
    frontendService: 'cranestack-frontend',
    adminEmail: 'admin@cranestack.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Projects',
    brandColor: '#ea580c',
    seedScript: 'seed:cranestack',
  },
  {
    slug: 'edupulse',
    company: 'EduPulse',
    port: 13010,
    frontendService: 'edupulse-frontend',
    adminEmail: 'admin@edupulse.com',
    adminPassword: 'demo123',
    expectedPrimaryBoard: 'Courses',
    brandColor: '#6d28d9',
    seedScript: 'seed:edupulse',
  },
];

export function findIndustry(slug: string): IndustrySpec {
  const match = INDUSTRIES.find((i) => i.slug === slug);
  if (!match) {
    throw new Error(
      `Unknown industry "${slug}". Valid: ${INDUSTRIES.map((i) => i.slug).join(', ')}`
    );
  }
  return match;
}
