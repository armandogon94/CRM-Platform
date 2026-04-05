import bcrypt from 'bcryptjs';
import Workspace from '../../models/Workspace';
import User from '../../models/User';

export interface SwiftRouteContext {
  workspaceId: number;
  adminId: number;
  dispatchManagerId: number;
  fleetManagerId: number;
  driverIds: number[];
  dispatcherIds: number[];
  viewerId: number;
}

// ─── 120 Driver Profiles + Support Staff ────────────────────────────────────
// Realistic names, diverse backgrounds — logistics workforce

const SWIFTROUTE_USERS = [
  // Leadership & Admin (4)
  { email: 'admin@swiftroute.com', firstName: 'Carlos', lastName: 'Reyes', role: 'admin' as const },
  { email: 'ceo@swiftroute.com', firstName: 'Vanessa', lastName: 'Okafor', role: 'admin' as const },
  { email: 'dispatch.manager@swiftroute.com', firstName: 'Derek', lastName: 'Holmberg', role: 'member' as const },
  { email: 'fleet.manager@swiftroute.com', firstName: 'Priya', lastName: 'Sharma', role: 'member' as const },

  // Dispatchers (6)
  { email: 'dispatcher1@swiftroute.com', firstName: 'Marcus', lastName: 'Bell', role: 'member' as const },
  { email: 'dispatcher2@swiftroute.com', firstName: 'Yuki', lastName: 'Tanaka', role: 'member' as const },
  { email: 'dispatcher3@swiftroute.com', firstName: 'Aaliyah', lastName: 'Johnson', role: 'member' as const },
  { email: 'dispatcher4@swiftroute.com', firstName: 'Tomás', lastName: 'Herrera', role: 'member' as const },
  { email: 'dispatcher5@swiftroute.com', firstName: 'Nadia', lastName: 'Petrova', role: 'member' as const },
  { email: 'dispatcher6@swiftroute.com', firstName: 'Kwame', lastName: 'Asante', role: 'member' as const },

  // Drivers (120)
  { email: 'driver001@swiftroute.com', firstName: 'James', lastName: 'Rodriguez', role: 'member' as const },
  { email: 'driver002@swiftroute.com', firstName: 'Sarah', lastName: 'Mitchell', role: 'member' as const },
  { email: 'driver003@swiftroute.com', firstName: 'Michael', lastName: 'Chen', role: 'member' as const },
  { email: 'driver004@swiftroute.com', firstName: 'Emily', lastName: 'Watson', role: 'member' as const },
  { email: 'driver005@swiftroute.com', firstName: 'David', lastName: 'Okonkwo', role: 'member' as const },
  { email: 'driver006@swiftroute.com', firstName: 'Jessica', lastName: 'Park', role: 'member' as const },
  { email: 'driver007@swiftroute.com', firstName: 'Robert', lastName: 'Fernandez', role: 'member' as const },
  { email: 'driver008@swiftroute.com', firstName: 'Amanda', lastName: 'Brooks', role: 'member' as const },
  { email: 'driver009@swiftroute.com', firstName: 'Kevin', lastName: 'Nakamura', role: 'member' as const },
  { email: 'driver010@swiftroute.com', firstName: 'Linda', lastName: 'Chambers', role: 'member' as const },
  { email: 'driver011@swiftroute.com', firstName: 'Daniel', lastName: 'Moreau', role: 'member' as const },
  { email: 'driver012@swiftroute.com', firstName: 'Rachel', lastName: 'Hoffman', role: 'member' as const },
  { email: 'driver013@swiftroute.com', firstName: 'Omar', lastName: 'Hassan', role: 'member' as const },
  { email: 'driver014@swiftroute.com', firstName: 'Catherine', lastName: 'Doyle', role: 'member' as const },
  { email: 'driver015@swiftroute.com', firstName: 'Tyler', lastName: 'Brooks', role: 'member' as const },
  { email: 'driver016@swiftroute.com', firstName: 'Angela', lastName: 'Kim', role: 'member' as const },
  { email: 'driver017@swiftroute.com', firstName: 'Brian', lastName: 'Kowalski', role: 'member' as const },
  { email: 'driver018@swiftroute.com', firstName: 'Diana', lastName: 'Ross-Chen', role: 'member' as const },
  { email: 'driver019@swiftroute.com', firstName: 'Thomas', lastName: 'Adebayo', role: 'member' as const },
  { email: 'driver020@swiftroute.com', firstName: 'Stephanie', lastName: 'Novak', role: 'member' as const },
  { email: 'driver021@swiftroute.com', firstName: 'Christopher', lastName: 'Yamamoto', role: 'member' as const },
  { email: 'driver022@swiftroute.com', firstName: 'Natalie', lastName: 'Sato', role: 'member' as const },
  { email: 'driver023@swiftroute.com', firstName: 'William', lastName: 'Garcia', role: 'member' as const },
  { email: 'driver024@swiftroute.com', firstName: 'Helen', lastName: 'Dubois', role: 'member' as const },
  { email: 'driver025@swiftroute.com', firstName: 'Andrew', lastName: 'Patel', role: 'member' as const },
  { email: 'driver026@swiftroute.com', firstName: 'Mia', lastName: 'Delacroix', role: 'member' as const },
  { email: 'driver027@swiftroute.com', firstName: 'Steven', lastName: 'Obeng', role: 'member' as const },
  { email: 'driver028@swiftroute.com', firstName: 'Hannah', lastName: 'Sullivan', role: 'member' as const },
  { email: 'driver029@swiftroute.com', firstName: 'Victor', lastName: 'Almeida', role: 'member' as const },
  { email: 'driver030@swiftroute.com', firstName: 'Jennifer', lastName: 'Okonkwo', role: 'member' as const },
  { email: 'driver031@swiftroute.com', firstName: 'George', lastName: 'Lindqvist', role: 'member' as const },
  { email: 'driver032@swiftroute.com', firstName: 'Sophia', lastName: 'Guerrero', role: 'member' as const },
  { email: 'driver033@swiftroute.com', firstName: 'Ahmed', lastName: 'Khalil', role: 'member' as const },
  { email: 'driver034@swiftroute.com', firstName: 'Olivia', lastName: 'Chang', role: 'member' as const },
  { email: 'driver035@swiftroute.com', firstName: 'Patrick', lastName: 'O\'Brien', role: 'member' as const },
  { email: 'driver036@swiftroute.com', firstName: 'Tamara', lastName: 'Volkov', role: 'member' as const },
  { email: 'driver037@swiftroute.com', firstName: 'Raj', lastName: 'Mehta', role: 'member' as const },
  { email: 'driver038@swiftroute.com', firstName: 'Nicole', lastName: 'Fitzgerald', role: 'member' as const },
  { email: 'driver039@swiftroute.com', firstName: 'Jason', lastName: 'Washington', role: 'member' as const },
  { email: 'driver040@swiftroute.com', firstName: 'Karen', lastName: 'Liu', role: 'member' as const },
  { email: 'driver041@swiftroute.com', firstName: 'Jamal', lastName: 'Franklin', role: 'member' as const },
  { email: 'driver042@swiftroute.com', firstName: 'Nancy', lastName: 'Zhao', role: 'member' as const },
  { email: 'driver043@swiftroute.com', firstName: 'Kenneth', lastName: 'Osei', role: 'member' as const },
  { email: 'driver044@swiftroute.com', firstName: 'Laura', lastName: 'Petrov', role: 'member' as const },
  { email: 'driver045@swiftroute.com', firstName: 'Paul', lastName: 'Jensen', role: 'member' as const },
  { email: 'driver046@swiftroute.com', firstName: 'Maria', lastName: 'Gonzalez', role: 'member' as const },
  { email: 'driver047@swiftroute.com', firstName: 'Nathan', lastName: 'Whitfield', role: 'member' as const },
  { email: 'driver048@swiftroute.com', firstName: 'Sandra', lastName: 'Kimura', role: 'member' as const },
  { email: 'driver049@swiftroute.com', firstName: 'Richard', lastName: 'Baptiste', role: 'member' as const },
  { email: 'driver050@swiftroute.com', firstName: 'Dorothy', lastName: 'Hernandez', role: 'member' as const },
  { email: 'driver051@swiftroute.com', firstName: 'Marcus', lastName: 'Obi', role: 'member' as const },
  { email: 'driver052@swiftroute.com', firstName: 'Teresa', lastName: 'Svensson', role: 'member' as const },
  { email: 'driver053@swiftroute.com', firstName: 'Antonio', lastName: 'Rossi', role: 'member' as const },
  { email: 'driver054@swiftroute.com', firstName: 'Fatima', lastName: 'Al-Rashid', role: 'member' as const },
  { email: 'driver055@swiftroute.com', firstName: 'Gregory', lastName: 'Tanaka', role: 'member' as const },
  { email: 'driver056@swiftroute.com', firstName: 'Michelle', lastName: 'Dupont', role: 'member' as const },
  { email: 'driver057@swiftroute.com', firstName: 'Darnell', lastName: 'Jackson', role: 'member' as const },
  { email: 'driver058@swiftroute.com', firstName: 'Christine', lastName: 'Mueller', role: 'member' as const },
  { email: 'driver059@swiftroute.com', firstName: 'Leo', lastName: 'Nguyen', role: 'member' as const },
  { email: 'driver060@swiftroute.com', firstName: 'Patricia', lastName: 'Morales', role: 'member' as const },
  { email: 'driver061@swiftroute.com', firstName: 'Elijah', lastName: 'Thompson', role: 'member' as const },
  { email: 'driver062@swiftroute.com', firstName: 'Brenda', lastName: 'Ortiz', role: 'member' as const },
  { email: 'driver063@swiftroute.com', firstName: 'Samuel', lastName: 'Nkosi', role: 'member' as const },
  { email: 'driver064@swiftroute.com', firstName: 'Deborah', lastName: 'Park-Kim', role: 'member' as const },
  { email: 'driver065@swiftroute.com', firstName: 'Frank', lastName: 'Bianchi', role: 'member' as const },
  { email: 'driver066@swiftroute.com', firstName: 'Cynthia', lastName: 'Ramirez', role: 'member' as const },
  { email: 'driver067@swiftroute.com', firstName: 'Isaac', lastName: 'Abrams', role: 'member' as const },
  { email: 'driver068@swiftroute.com', firstName: 'Virginia', lastName: 'Kozlov', role: 'member' as const },
  { email: 'driver069@swiftroute.com', firstName: 'Terrence', lastName: 'Diaz', role: 'member' as const },
  { email: 'driver070@swiftroute.com', firstName: 'Lorraine', lastName: 'Watanabe', role: 'member' as const },
  { email: 'driver071@swiftroute.com', firstName: 'Desmond', lastName: 'Clarke', role: 'member' as const },
  { email: 'driver072@swiftroute.com', firstName: 'Irene', lastName: 'Santos', role: 'member' as const },
  { email: 'driver073@swiftroute.com', firstName: 'Malik', lastName: 'Hussain', role: 'member' as const },
  { email: 'driver074@swiftroute.com', firstName: 'Gloria', lastName: 'Eriksson', role: 'member' as const },
  { email: 'driver075@swiftroute.com', firstName: 'Wesley', lastName: 'Lam', role: 'member' as const },
  { email: 'driver076@swiftroute.com', firstName: 'Connie', lastName: 'Takahashi', role: 'member' as const },
  { email: 'driver077@swiftroute.com', firstName: 'Jerome', lastName: 'Amponsah', role: 'member' as const },
  { email: 'driver078@swiftroute.com', firstName: 'Beverly', lastName: 'Johansson', role: 'member' as const },
  { email: 'driver079@swiftroute.com', firstName: 'Rashid', lastName: 'Mansour', role: 'member' as const },
  { email: 'driver080@swiftroute.com', firstName: 'Heather', lastName: 'Becker', role: 'member' as const },
  { email: 'driver081@swiftroute.com', firstName: 'Calvin', lastName: 'Mensah', role: 'member' as const },
  { email: 'driver082@swiftroute.com', firstName: 'Diane', lastName: 'Lebedev', role: 'member' as const },
  { email: 'driver083@swiftroute.com', firstName: 'Travis', lastName: 'Sandoval', role: 'member' as const },
  { email: 'driver084@swiftroute.com', firstName: 'Wendy', lastName: 'Ikeda', role: 'member' as const },
  { email: 'driver085@swiftroute.com', firstName: 'Donovan', lastName: 'Fischer', role: 'member' as const },
  { email: 'driver086@swiftroute.com', firstName: 'Sylvia', lastName: 'Afolabi', role: 'member' as const },
  { email: 'driver087@swiftroute.com', firstName: 'Howard', lastName: 'Cárdenas', role: 'member' as const },
  { email: 'driver088@swiftroute.com', firstName: 'Joy', lastName: 'Christensen', role: 'member' as const },
  { email: 'driver089@swiftroute.com', firstName: 'Clifford', lastName: 'Mbeki', role: 'member' as const },
  { email: 'driver090@swiftroute.com', firstName: 'Tanya', lastName: 'Popov', role: 'member' as const },
  { email: 'driver091@swiftroute.com', firstName: 'Ruben', lastName: 'Alvarez', role: 'member' as const },
  { email: 'driver092@swiftroute.com', firstName: 'Marlene', lastName: 'Wong', role: 'member' as const },
  { email: 'driver093@swiftroute.com', firstName: 'Andre', lastName: 'Dlamini', role: 'member' as const },
  { email: 'driver094@swiftroute.com', firstName: 'Carmen', lastName: 'Vega', role: 'member' as const },
  { email: 'driver095@swiftroute.com', firstName: 'Felix', lastName: 'Bergmann', role: 'member' as const },
  { email: 'driver096@swiftroute.com', firstName: 'Rosa', lastName: 'Fuentes', role: 'member' as const },
  { email: 'driver097@swiftroute.com', firstName: 'Gilbert', lastName: 'Owusu', role: 'member' as const },
  { email: 'driver098@swiftroute.com', firstName: 'Evelyn', lastName: 'Kuznetsova', role: 'member' as const },
  { email: 'driver099@swiftroute.com', firstName: 'Darryl', lastName: 'Simmons', role: 'member' as const },
  { email: 'driver100@swiftroute.com', firstName: 'Monique', lastName: 'Leblanc', role: 'member' as const },
  { email: 'driver101@swiftroute.com', firstName: 'Alberto', lastName: 'Gutierrez', role: 'member' as const },
  { email: 'driver102@swiftroute.com', firstName: 'Naomi', lastName: 'Hayashi', role: 'member' as const },
  { email: 'driver103@swiftroute.com', firstName: 'Curtis', lastName: 'Boateng', role: 'member' as const },
  { email: 'driver104@swiftroute.com', firstName: 'Sabrina', lastName: 'Ivanova', role: 'member' as const },
  { email: 'driver105@swiftroute.com', firstName: 'Rodney', lastName: 'Cruz', role: 'member' as const },
  { email: 'driver106@swiftroute.com', firstName: 'Ingrid', lastName: 'Larsson', role: 'member' as const },
  { email: 'driver107@swiftroute.com', firstName: 'Alvin', lastName: 'Opoku', role: 'member' as const },
  { email: 'driver108@swiftroute.com', firstName: 'Valerie', lastName: 'Romano', role: 'member' as const },
  { email: 'driver109@swiftroute.com', firstName: 'Cedric', lastName: 'Moyo', role: 'member' as const },
  { email: 'driver110@swiftroute.com', firstName: 'Lillian', lastName: 'Bauer', role: 'member' as const },
  { email: 'driver111@swiftroute.com', firstName: 'Oscar', lastName: 'Villalobos', role: 'member' as const },
  { email: 'driver112@swiftroute.com', firstName: 'Renée', lastName: 'Fournier', role: 'member' as const },
  { email: 'driver113@swiftroute.com', firstName: 'Quincy', lastName: 'Appiah', role: 'member' as const },
  { email: 'driver114@swiftroute.com', firstName: 'Beth', lastName: 'Kowalczyk', role: 'member' as const },
  { email: 'driver115@swiftroute.com', firstName: 'Emeka', lastName: 'Eze', role: 'member' as const },
  { email: 'driver116@swiftroute.com', firstName: 'Kira', lastName: 'Sorokin', role: 'member' as const },
  { email: 'driver117@swiftroute.com', firstName: 'Hector', lastName: 'Paredes', role: 'member' as const },
  { email: 'driver118@swiftroute.com', firstName: 'Fiona', lastName: 'MacLeod', role: 'member' as const },
  { email: 'driver119@swiftroute.com', firstName: 'Raymond', lastName: 'Okoro', role: 'member' as const },
  { email: 'driver120@swiftroute.com', firstName: 'Simone', lastName: 'De Vries', role: 'member' as const },

  // Viewer
  { email: 'viewer@swiftroute.com', firstName: 'Alex', lastName: 'Rivera', role: 'viewer' as const },
];

export async function seedSwiftRouteWorkspace(): Promise<SwiftRouteContext> {
  console.log('[SwiftRoute] Seeding workspace and users...');

  const workspace = await Workspace.create({
    name: 'SwiftRoute Logistics',
    slug: 'swiftroute',
    description: 'Last-mile delivery & logistics management platform',
    settings: {
      brandColor: '#7C3AED',
      secondaryColor: '#6D28D9',
      accentColor: '#A78BFA',
      surfaceColor: '#F5F3FF',
      industry: 'logistics',
      tagline: 'Delivering Excellence, Every Mile',
      logo: '/assets/swiftroute-logo.svg',
      modules: ['shipments', 'routes', 'fleet', 'drivers'],
    },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);

  const users: User[] = [];
  for (const userData of SWIFTROUTE_USERS) {
    const user = await User.create({
      ...userData,
      passwordHash,
      workspaceId: workspace.id,
    });
    users.push(user);
  }

  await Workspace.update({ createdBy: users[0].id }, { where: { id: workspace.id } });

  console.log(`[SwiftRoute] Created workspace (id=${workspace.id}) with ${users.length} users (120 drivers + 11 staff)`);

  return {
    workspaceId: workspace.id,
    adminId: users[0].id,
    dispatchManagerId: users[2].id,
    fleetManagerId: users[3].id,
    dispatcherIds: [users[4].id, users[5].id, users[6].id, users[7].id, users[8].id, users[9].id],
    driverIds: users.slice(10, 130).map((u) => u.id),
    viewerId: users[130].id,
  };
}
