import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { EduPulseContext } from './workspace';
import { EduPulseBoards } from './boards';

// ─── 100 Student Records ───────────────────────────────────────────────────
// Realistic mix across statuses and grade levels
// ~15 Inquiry, ~15 Application, ~15 Accepted, ~30 Enrolled, ~15 Graduated, ~10 Withdrawn

interface StudentRecord {
  name: string;
  gradeLevel: string;
  applicationDate: string;
  enrollmentDate: string | null;
  gpa: number | null;
  parentContact: string;
  status: string;
  group: 'inquiry' | 'application' | 'accepted' | 'enrolled' | 'graduated' | 'withdrawn';
}

const STUDENTS: StudentRecord[] = [
  // ─── Inquiry (15) ────────────────────────────────────────────
  { name: 'Aiden Patel', gradeLevel: '9', applicationDate: '2026-03-28', enrollmentDate: null, gpa: null, parentContact: 'Ravi Patel (555) 201-1001', status: 'inquiry', group: 'inquiry' },
  { name: 'Sofia Martinez', gradeLevel: 'k', applicationDate: '2026-03-29', enrollmentDate: null, gpa: null, parentContact: 'Carmen Martinez (555) 201-1002', status: 'inquiry', group: 'inquiry' },
  { name: 'Lucas Johansson', gradeLevel: '6', applicationDate: '2026-03-30', enrollmentDate: null, gpa: null, parentContact: 'Erik Johansson (555) 201-1003', status: 'inquiry', group: 'inquiry' },
  { name: 'Emma Okafor', gradeLevel: 'college', applicationDate: '2026-03-27', enrollmentDate: null, gpa: null, parentContact: 'Chinwe Okafor (555) 201-1004', status: 'inquiry', group: 'inquiry' },
  { name: 'Mason Chen', gradeLevel: '3', applicationDate: '2026-03-31', enrollmentDate: null, gpa: null, parentContact: 'Wei Chen (555) 201-1005', status: 'inquiry', group: 'inquiry' },
  { name: 'Isabella Torres', gradeLevel: '10', applicationDate: '2026-04-01', enrollmentDate: null, gpa: null, parentContact: 'Miguel Torres (555) 201-1006', status: 'inquiry', group: 'inquiry' },
  { name: 'Ethan Kowalski', gradeLevel: '7', applicationDate: '2026-03-26', enrollmentDate: null, gpa: null, parentContact: 'Anna Kowalski (555) 201-1007', status: 'inquiry', group: 'inquiry' },
  { name: 'Ava Nakamura', gradeLevel: '1', applicationDate: '2026-04-02', enrollmentDate: null, gpa: null, parentContact: 'Yuki Nakamura (555) 201-1008', status: 'inquiry', group: 'inquiry' },
  { name: 'Noah Brooks', gradeLevel: '11', applicationDate: '2026-03-25', enrollmentDate: null, gpa: null, parentContact: 'Jennifer Brooks (555) 201-1009', status: 'inquiry', group: 'inquiry' },
  { name: 'Mia Petrov', gradeLevel: '4', applicationDate: '2026-03-28', enrollmentDate: null, gpa: null, parentContact: 'Alexei Petrov (555) 201-1010', status: 'inquiry', group: 'inquiry' },
  { name: 'Oliver Dubois', gradeLevel: 'college', applicationDate: '2026-03-30', enrollmentDate: null, gpa: null, parentContact: 'Jean Dubois (555) 201-1011', status: 'inquiry', group: 'inquiry' },
  { name: 'Charlotte Hassan', gradeLevel: '8', applicationDate: '2026-03-27', enrollmentDate: null, gpa: null, parentContact: 'Fatima Hassan (555) 201-1012', status: 'inquiry', group: 'inquiry' },
  { name: 'Elijah Santos', gradeLevel: '2', applicationDate: '2026-04-01', enrollmentDate: null, gpa: null, parentContact: 'Maria Santos (555) 201-1013', status: 'inquiry', group: 'inquiry' },
  { name: 'Amelia Reeves', gradeLevel: '5', applicationDate: '2026-03-29', enrollmentDate: null, gpa: null, parentContact: 'David Reeves (555) 201-1014', status: 'inquiry', group: 'inquiry' },
  { name: 'James Adeyemi', gradeLevel: '12', applicationDate: '2026-03-26', enrollmentDate: null, gpa: null, parentContact: 'Olu Adeyemi (555) 201-1015', status: 'inquiry', group: 'inquiry' },

  // ─── Application (15) ────────────────────────────────────────
  { name: 'Harper Kim', gradeLevel: '9', applicationDate: '2026-03-15', enrollmentDate: null, gpa: 3.5, parentContact: 'Soo-Jin Kim (555) 202-1001', status: 'application', group: 'application' },
  { name: 'Benjamin Sullivan', gradeLevel: '6', applicationDate: '2026-03-10', enrollmentDate: null, gpa: 3.2, parentContact: 'Patrick Sullivan (555) 202-1002', status: 'application', group: 'application' },
  { name: 'Aria Gonzalez', gradeLevel: 'college', applicationDate: '2026-03-12', enrollmentDate: null, gpa: 3.8, parentContact: 'Rosa Gonzalez (555) 202-1003', status: 'application', group: 'application' },
  { name: 'Henry Lindqvist', gradeLevel: '3', applicationDate: '2026-03-14', enrollmentDate: null, gpa: null, parentContact: 'Lars Lindqvist (555) 202-1004', status: 'application', group: 'application' },
  { name: 'Scarlett Achebe', gradeLevel: '10', applicationDate: '2026-03-08', enrollmentDate: null, gpa: 3.6, parentContact: 'Emeka Achebe (555) 202-1005', status: 'application', group: 'application' },
  { name: 'Alexander Moreau', gradeLevel: 'k', applicationDate: '2026-03-16', enrollmentDate: null, gpa: null, parentContact: 'Claire Moreau (555) 202-1006', status: 'application', group: 'application' },
  { name: 'Luna Watanabe', gradeLevel: '7', applicationDate: '2026-03-11', enrollmentDate: null, gpa: 3.1, parentContact: 'Kenji Watanabe (555) 202-1007', status: 'application', group: 'application' },
  { name: 'Sebastian Blake', gradeLevel: '11', applicationDate: '2026-03-09', enrollmentDate: null, gpa: 2.9, parentContact: 'Thomas Blake (555) 202-1008', status: 'application', group: 'application' },
  { name: 'Chloe Park', gradeLevel: '4', applicationDate: '2026-03-13', enrollmentDate: null, gpa: null, parentContact: 'Min-Ho Park (555) 202-1009', status: 'application', group: 'application' },
  { name: 'Jack Novak', gradeLevel: '12', applicationDate: '2026-03-07', enrollmentDate: null, gpa: 3.4, parentContact: 'Helena Novak (555) 202-1010', status: 'application', group: 'application' },
  { name: 'Lily Engstrom', gradeLevel: '2', applicationDate: '2026-03-17', enrollmentDate: null, gpa: null, parentContact: 'Stefan Engstrom (555) 202-1011', status: 'application', group: 'application' },
  { name: 'Owen Hernandez', gradeLevel: '8', applicationDate: '2026-03-06', enrollmentDate: null, gpa: 3.0, parentContact: 'Carlos Hernandez (555) 202-1012', status: 'application', group: 'application' },
  { name: 'Zoey Magnusson', gradeLevel: '5', applicationDate: '2026-03-18', enrollmentDate: null, gpa: null, parentContact: 'Anders Magnusson (555) 202-1013', status: 'application', group: 'application' },
  { name: 'Daniel Washington', gradeLevel: 'college', applicationDate: '2026-03-05', enrollmentDate: null, gpa: 3.7, parentContact: 'Grace Washington (555) 202-1014', status: 'application', group: 'application' },
  { name: 'Penelope Ivanov', gradeLevel: '1', applicationDate: '2026-03-19', enrollmentDate: null, gpa: null, parentContact: 'Dmitri Ivanov (555) 202-1015', status: 'application', group: 'application' },

  // ─── Accepted (15) ───────────────────────────────────────────
  { name: 'Jackson Almeida', gradeLevel: '9', applicationDate: '2026-02-20', enrollmentDate: null, gpa: 3.6, parentContact: 'Paulo Almeida (555) 203-1001', status: 'accepted', group: 'accepted' },
  { name: 'Grace Yamamoto', gradeLevel: '6', applicationDate: '2026-02-15', enrollmentDate: null, gpa: 3.9, parentContact: 'Takeshi Yamamoto (555) 203-1002', status: 'accepted', group: 'accepted' },
  { name: 'Levi Christensen', gradeLevel: 'college', applicationDate: '2026-02-18', enrollmentDate: null, gpa: 3.3, parentContact: 'Erik Christensen (555) 203-1003', status: 'accepted', group: 'accepted' },
  { name: 'Riley Obeng', gradeLevel: '3', applicationDate: '2026-02-22', enrollmentDate: null, gpa: null, parentContact: 'Kwame Obeng (555) 203-1004', status: 'accepted', group: 'accepted' },
  { name: 'Nora Fernandez', gradeLevel: '10', applicationDate: '2026-02-12', enrollmentDate: null, gpa: 3.7, parentContact: 'Diego Fernandez (555) 203-1005', status: 'accepted', group: 'accepted' },
  { name: 'Caleb Svensson', gradeLevel: 'k', applicationDate: '2026-02-25', enrollmentDate: null, gpa: null, parentContact: 'Olof Svensson (555) 203-1006', status: 'accepted', group: 'accepted' },
  { name: 'Hazel Dominguez', gradeLevel: '7', applicationDate: '2026-02-14', enrollmentDate: null, gpa: 3.4, parentContact: 'Sofia Dominguez (555) 203-1007', status: 'accepted', group: 'accepted' },
  { name: 'Leo Morrison', gradeLevel: '11', applicationDate: '2026-02-10', enrollmentDate: null, gpa: 3.1, parentContact: 'James Morrison (555) 203-1008', status: 'accepted', group: 'accepted' },
  { name: 'Violet Rao', gradeLevel: '4', applicationDate: '2026-02-21', enrollmentDate: null, gpa: null, parentContact: 'Sanjay Rao (555) 203-1009', status: 'accepted', group: 'accepted' },
  { name: 'Isaac Hoffman', gradeLevel: '12', applicationDate: '2026-02-08', enrollmentDate: null, gpa: 3.8, parentContact: 'Michael Hoffman (555) 203-1010', status: 'accepted', group: 'accepted' },
  { name: 'Stella Kozlov', gradeLevel: '2', applicationDate: '2026-02-24', enrollmentDate: null, gpa: null, parentContact: 'Andrei Kozlov (555) 203-1011', status: 'accepted', group: 'accepted' },
  { name: 'Mateo Andersen', gradeLevel: '8', applicationDate: '2026-02-11', enrollmentDate: null, gpa: 3.5, parentContact: 'Hans Andersen (555) 203-1012', status: 'accepted', group: 'accepted' },
  { name: 'Aurora Osei', gradeLevel: '5', applicationDate: '2026-02-23', enrollmentDate: null, gpa: null, parentContact: 'Nana Osei (555) 203-1013', status: 'accepted', group: 'accepted' },
  { name: 'Hudson Chang', gradeLevel: 'college', applicationDate: '2026-02-07', enrollmentDate: null, gpa: 3.2, parentContact: 'Li Chang (555) 203-1014', status: 'accepted', group: 'accepted' },
  { name: 'Isla Al-Rashid', gradeLevel: '1', applicationDate: '2026-02-26', enrollmentDate: null, gpa: null, parentContact: 'Ahmed Al-Rashid (555) 203-1015', status: 'accepted', group: 'accepted' },

  // ─── Enrolled (30) ───────────────────────────────────────────
  { name: 'Emily Sato', gradeLevel: '9', applicationDate: '2025-12-01', enrollmentDate: '2026-01-15', gpa: 3.7, parentContact: 'Hiroshi Sato (555) 204-1001', status: 'enrolled', group: 'enrolled' },
  { name: 'Logan Mitchell', gradeLevel: '10', applicationDate: '2025-11-20', enrollmentDate: '2026-01-10', gpa: 3.4, parentContact: 'Sarah Mitchell (555) 204-1002', status: 'enrolled', group: 'enrolled' },
  { name: 'Avery Rodriguez', gradeLevel: '6', applicationDate: '2025-12-05', enrollmentDate: '2026-01-12', gpa: 3.8, parentContact: 'Elena Rodriguez (555) 204-1003', status: 'enrolled', group: 'enrolled' },
  { name: 'Carter Anderson', gradeLevel: '11', applicationDate: '2025-11-15', enrollmentDate: '2026-01-08', gpa: 2.9, parentContact: 'Mark Anderson (555) 204-1004', status: 'enrolled', group: 'enrolled' },
  { name: 'Layla Nguyen', gradeLevel: '7', applicationDate: '2025-12-10', enrollmentDate: '2026-01-18', gpa: 3.6, parentContact: 'Thanh Nguyen (555) 204-1005', status: 'enrolled', group: 'enrolled' },
  { name: 'Jayden Williams', gradeLevel: '3', applicationDate: '2025-12-15', enrollmentDate: '2026-01-20', gpa: null, parentContact: 'DeShawn Williams (555) 204-1006', status: 'enrolled', group: 'enrolled' },
  { name: 'Willow Tanaka', gradeLevel: 'college', applicationDate: '2025-11-10', enrollmentDate: '2026-01-05', gpa: 3.9, parentContact: 'Akiko Tanaka (555) 204-1007', status: 'enrolled', group: 'enrolled' },
  { name: 'Ezra Thompson', gradeLevel: '12', applicationDate: '2025-11-25', enrollmentDate: '2026-01-14', gpa: 3.2, parentContact: 'Robert Thompson (555) 204-1008', status: 'enrolled', group: 'enrolled' },
  { name: 'Nova Garcia', gradeLevel: 'k', applicationDate: '2025-12-20', enrollmentDate: '2026-01-22', gpa: null, parentContact: 'Isabel Garcia (555) 204-1009', status: 'enrolled', group: 'enrolled' },
  { name: 'Miles Kumar', gradeLevel: '8', applicationDate: '2025-12-02', enrollmentDate: '2026-01-16', gpa: 3.3, parentContact: 'Rajesh Kumar (555) 204-1010', status: 'enrolled', group: 'enrolled' },
  { name: 'Savannah Laurent', gradeLevel: '4', applicationDate: '2025-12-08', enrollmentDate: '2026-01-19', gpa: null, parentContact: 'Pierre Laurent (555) 204-1011', status: 'enrolled', group: 'enrolled' },
  { name: 'Ryan Zhao', gradeLevel: '9', applicationDate: '2025-11-28', enrollmentDate: '2026-01-11', gpa: 3.5, parentContact: 'Wei Zhao (555) 204-1012', status: 'enrolled', group: 'enrolled' },
  { name: 'Brooklyn Eriksson', gradeLevel: '10', applicationDate: '2025-12-12', enrollmentDate: '2026-01-17', gpa: 2.8, parentContact: 'Magnus Eriksson (555) 204-1013', status: 'enrolled', group: 'enrolled' },
  { name: 'Nathan Mbeki', gradeLevel: '6', applicationDate: '2025-11-22', enrollmentDate: '2026-01-09', gpa: 3.7, parentContact: 'Thabo Mbeki (555) 204-1014', status: 'enrolled', group: 'enrolled' },
  { name: 'Audrey Moreno', gradeLevel: '11', applicationDate: '2025-12-18', enrollmentDate: '2026-01-21', gpa: 1.8, parentContact: 'Javier Moreno (555) 204-1015', status: 'enrolled', group: 'enrolled' },
  { name: 'Thomas Björk', gradeLevel: '7', applicationDate: '2025-11-18', enrollmentDate: '2026-01-07', gpa: 3.1, parentContact: 'Nils Björk (555) 204-1016', status: 'enrolled', group: 'enrolled' },
  { name: 'Hannah Cohen', gradeLevel: 'college', applicationDate: '2025-12-03', enrollmentDate: '2026-01-13', gpa: 3.8, parentContact: 'David Cohen (555) 204-1017', status: 'enrolled', group: 'enrolled' },
  { name: 'Adrian Nwosu', gradeLevel: '5', applicationDate: '2025-12-22', enrollmentDate: '2026-01-23', gpa: null, parentContact: 'Chidi Nwosu (555) 204-1018', status: 'enrolled', group: 'enrolled' },
  { name: 'Victoria Petersen', gradeLevel: '12', applicationDate: '2025-11-12', enrollmentDate: '2026-01-06', gpa: 3.0, parentContact: 'Henrik Petersen (555) 204-1019', status: 'enrolled', group: 'enrolled' },
  { name: 'Cooper Lee', gradeLevel: '2', applicationDate: '2025-12-25', enrollmentDate: '2026-01-24', gpa: null, parentContact: 'Daniel Lee (555) 204-1020', status: 'enrolled', group: 'enrolled' },
  { name: 'Madeline Odom', gradeLevel: '8', applicationDate: '2025-11-30', enrollmentDate: '2026-01-15', gpa: 1.9, parentContact: 'Kevin Odom (555) 204-1021', status: 'enrolled', group: 'enrolled' },
  { name: 'Lincoln Vargas', gradeLevel: '9', applicationDate: '2025-12-06', enrollmentDate: '2026-01-18', gpa: 3.4, parentContact: 'Ana Vargas (555) 204-1022', status: 'enrolled', group: 'enrolled' },
  { name: 'Addison Fujimoto', gradeLevel: '1', applicationDate: '2025-12-28', enrollmentDate: '2026-01-25', gpa: null, parentContact: 'Ken Fujimoto (555) 204-1023', status: 'enrolled', group: 'enrolled' },
  { name: 'Bentley Okonkwo', gradeLevel: '10', applicationDate: '2025-11-16', enrollmentDate: '2026-01-08', gpa: 3.6, parentContact: 'Ngozi Okonkwo (555) 204-1024', status: 'enrolled', group: 'enrolled' },
  { name: 'Naomi Bergstrom', gradeLevel: 'college', applicationDate: '2025-12-14', enrollmentDate: '2026-01-20', gpa: 3.9, parentContact: 'Karl Bergstrom (555) 204-1025', status: 'enrolled', group: 'enrolled' },
  { name: 'Dylan Harris', gradeLevel: '6', applicationDate: '2025-11-24', enrollmentDate: '2026-01-10', gpa: 2.7, parentContact: 'Angela Harris (555) 204-1026', status: 'enrolled', group: 'enrolled' },
  { name: 'Paisley Nakamura', gradeLevel: '11', applicationDate: '2025-12-09', enrollmentDate: '2026-01-16', gpa: 1.6, parentContact: 'Taro Nakamura (555) 204-1027', status: 'enrolled', group: 'enrolled' },
  { name: 'Nolan Krishnamurthy', gradeLevel: '3', applicationDate: '2025-12-30', enrollmentDate: '2026-01-26', gpa: null, parentContact: 'Venkat Krishnamurthy (555) 204-1028', status: 'enrolled', group: 'enrolled' },
  { name: 'Leah Johansson', gradeLevel: '7', applicationDate: '2025-11-26', enrollmentDate: '2026-01-12', gpa: 3.3, parentContact: 'Sven Johansson (555) 204-1029', status: 'enrolled', group: 'enrolled' },
  { name: 'Samuel Rivera', gradeLevel: '12', applicationDate: '2025-12-16', enrollmentDate: '2026-01-19', gpa: 3.0, parentContact: 'Maria Rivera (555) 204-1030', status: 'enrolled', group: 'enrolled' },

  // ─── Graduated (15) ──────────────────────────────────────────
  { name: 'Zoe Abrams', gradeLevel: '12', applicationDate: '2023-09-01', enrollmentDate: '2023-09-15', gpa: 3.9, parentContact: 'Michael Abrams (555) 205-1001', status: 'graduated', group: 'graduated' },
  { name: 'Gabriel Novak', gradeLevel: 'college', applicationDate: '2022-06-01', enrollmentDate: '2022-08-20', gpa: 3.7, parentContact: 'Ivan Novak (555) 205-1002', status: 'graduated', group: 'graduated' },
  { name: 'Ella Petrov', gradeLevel: '12', applicationDate: '2023-08-15', enrollmentDate: '2023-09-10', gpa: 3.5, parentContact: 'Sergei Petrov (555) 205-1003', status: 'graduated', group: 'graduated' },
  { name: 'Samuel Chen', gradeLevel: 'college', applicationDate: '2022-05-20', enrollmentDate: '2022-08-15', gpa: 3.8, parentContact: 'Ling Chen (555) 205-1004', status: 'graduated', group: 'graduated' },
  { name: 'Aria Nguyen', gradeLevel: '12', applicationDate: '2023-09-05', enrollmentDate: '2023-09-20', gpa: 3.4, parentContact: 'Minh Nguyen (555) 205-1005', status: 'graduated', group: 'graduated' },
  { name: 'William Santos', gradeLevel: 'college', applicationDate: '2022-07-01', enrollmentDate: '2022-09-01', gpa: 3.6, parentContact: 'Jorge Santos (555) 205-1006', status: 'graduated', group: 'graduated' },
  { name: 'Chloe Anderson', gradeLevel: '12', applicationDate: '2023-08-20', enrollmentDate: '2023-09-12', gpa: 3.2, parentContact: 'Kevin Anderson (555) 205-1007', status: 'graduated', group: 'graduated' },
  { name: 'Isaac Dominguez', gradeLevel: 'college', applicationDate: '2022-06-15', enrollmentDate: '2022-08-25', gpa: 3.9, parentContact: 'Maria Dominguez (555) 205-1008', status: 'graduated', group: 'graduated' },
  { name: 'Nora Blake', gradeLevel: '12', applicationDate: '2023-08-25', enrollmentDate: '2023-09-08', gpa: 3.3, parentContact: 'Richard Blake (555) 205-1009', status: 'graduated', group: 'graduated' },
  { name: 'Aiden Martinez', gradeLevel: 'college', applicationDate: '2022-05-10', enrollmentDate: '2022-08-18', gpa: 3.1, parentContact: 'Rosa Martinez (555) 205-1010', status: 'graduated', group: 'graduated' },
  { name: 'Scarlett Thompson', gradeLevel: '12', applicationDate: '2023-09-10', enrollmentDate: '2023-09-25', gpa: 3.8, parentContact: 'Linda Thompson (555) 205-1011', status: 'graduated', group: 'graduated' },
  { name: 'Leo Watanabe', gradeLevel: 'college', applicationDate: '2022-07-10', enrollmentDate: '2022-09-05', gpa: 3.5, parentContact: 'Kenji Watanabe (555) 205-1012', status: 'graduated', group: 'graduated' },
  { name: 'Mila Svensson', gradeLevel: '12', applicationDate: '2023-08-10', enrollmentDate: '2023-09-05', gpa: 3.7, parentContact: 'Lars Svensson (555) 205-1013', status: 'graduated', group: 'graduated' },
  { name: 'Ezra Kim', gradeLevel: 'college', applicationDate: '2022-06-20', enrollmentDate: '2022-08-28', gpa: 3.4, parentContact: 'Sung Kim (555) 205-1014', status: 'graduated', group: 'graduated' },
  { name: 'Luna Hoffman', gradeLevel: '12', applicationDate: '2023-09-08', enrollmentDate: '2023-09-22', gpa: 3.6, parentContact: 'Brian Hoffman (555) 205-1015', status: 'graduated', group: 'graduated' },

  // ─── Withdrawn (10) ──────────────────────────────────────────
  { name: 'Henry Osei', gradeLevel: '9', applicationDate: '2025-10-01', enrollmentDate: '2025-11-01', gpa: 2.1, parentContact: 'Kofi Osei (555) 206-1001', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Lily Moreau', gradeLevel: '10', applicationDate: '2025-09-15', enrollmentDate: '2025-10-15', gpa: 1.5, parentContact: 'Jacques Moreau (555) 206-1002', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Jack Sullivan', gradeLevel: '6', applicationDate: '2025-10-10', enrollmentDate: '2025-11-10', gpa: 2.4, parentContact: 'Sean Sullivan (555) 206-1003', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Zoey Chang', gradeLevel: 'college', applicationDate: '2025-09-01', enrollmentDate: '2025-10-01', gpa: 1.8, parentContact: 'Mei Chang (555) 206-1004', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Owen Reeves', gradeLevel: '11', applicationDate: '2025-10-20', enrollmentDate: '2025-11-20', gpa: 1.3, parentContact: 'Frank Reeves (555) 206-1005', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Penelope Achebe', gradeLevel: '7', applicationDate: '2025-09-20', enrollmentDate: '2025-10-20', gpa: 2.0, parentContact: 'Obi Achebe (555) 206-1006', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Caleb Magnusson', gradeLevel: '8', applicationDate: '2025-10-05', enrollmentDate: '2025-11-05', gpa: 1.7, parentContact: 'Anders Magnusson (555) 206-1007', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Hazel Laurent', gradeLevel: '12', applicationDate: '2025-09-10', enrollmentDate: '2025-10-10', gpa: 2.3, parentContact: 'Marc Laurent (555) 206-1008', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Sebastian Odom', gradeLevel: '4', applicationDate: '2025-10-15', enrollmentDate: '2025-11-15', gpa: null, parentContact: 'Karen Odom (555) 206-1009', status: 'withdrawn', group: 'withdrawn' },
  { name: 'Riley Ivanov', gradeLevel: 'college', applicationDate: '2025-09-05', enrollmentDate: '2025-10-05', gpa: 1.4, parentContact: 'Boris Ivanov (555) 206-1010', status: 'withdrawn', group: 'withdrawn' },
];

export async function seedStudents(ctx: EduPulseContext, boards: EduPulseBoards): Promise<void> {
  console.log('[EduPulse] Seeding 100 student records...');

  const groupMap: Record<string, number> = {
    inquiry: boards.studentInquiryGroupId,
    application: boards.studentApplicationGroupId,
    accepted: boards.studentAcceptedGroupId,
    enrolled: boards.studentEnrolledGroupId,
    graduated: boards.studentGraduatedGroupId,
    withdrawn: boards.studentWithdrawnGroupId,
  };

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];

    const item = await Item.create({
      boardId: boards.studentEnrollmentId,
      groupId: groupMap[s.group],
      name: s.name,
      position: i,
      createdBy: ctx.registrarId,
    });

    const columnValues: Array<{ itemId: number; columnId: number; value: Record<string, unknown> }> = [
      { itemId: item.id, columnId: boards.studentStatusColId, value: { labelId: s.status } },
      { itemId: item.id, columnId: boards.gradeLevelColId, value: { selectedId: s.gradeLevel } },
      { itemId: item.id, columnId: boards.applicationDateColId, value: { date: s.applicationDate } },
      { itemId: item.id, columnId: boards.parentContactColId, value: { text: s.parentContact } },
    ];

    if (s.enrollmentDate) {
      columnValues.push({ itemId: item.id, columnId: boards.enrollmentDateColId, value: { date: s.enrollmentDate } });
    }

    if (s.gpa !== null) {
      columnValues.push({ itemId: item.id, columnId: boards.gpaColId, value: { number: s.gpa } });
    }

    await ColumnValue.bulkCreate(columnValues);
  }

  console.log(`[EduPulse] Seeded ${STUDENTS.length} students`);
}
