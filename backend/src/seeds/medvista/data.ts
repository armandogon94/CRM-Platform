import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { MedVistaContext } from './workspace';
import { MedVistaBoards } from './boards';

// ─── Patient Data ───────────────────────────────────────────────────────────

interface PatientRecord {
  name: string;
  specialty: string;
  status: 'New' | 'Intake' | 'Active' | 'Discharged';
  insuranceVerified: boolean;
  firstAppointment: string;
  phone: string;
  email: string;
  dob: string;
  insuranceProvider: string;
}

const SPECIALTIES = ['Primary Care', 'Cardiology', 'Orthopedics', 'Pediatrics'];

const INSURANCE_PROVIDERS = ['Aetna', 'Blue Cross', 'Cigna', 'UnitedHealthcare', 'Medicare', 'Medicaid'];

const SPECIALTY_COLORS: Record<string, string> = {
  'Primary Care': '#059669',
  'Cardiology': '#DC2626',
  'Orthopedics': '#2563EB',
  'Pediatrics': '#9333EA',
};

const STATUS_COLORS: Record<string, string> = {
  'New': '#94A3B8',
  'Intake': '#FCD34D',
  'Active': '#34D399',
  'Discharged': '#6B7280',
};

const INSURANCE_IDS: Record<string, string> = {
  'Aetna': 'aetna',
  'Blue Cross': 'blue_cross',
  'Cigna': 'cigna',
  'UnitedHealthcare': 'united',
  'Medicare': 'medicare',
  'Medicaid': 'medicaid',
};

const SPECIALTY_IDS: Record<string, string> = {
  'Primary Care': 'primary_care',
  'Cardiology': 'cardiology',
  'Orthopedics': 'orthopedics',
  'Pediatrics': 'pediatrics',
};

// 100 patients: 60 Active, 15 Intake, 15 New, 10 Discharged
const PATIENTS: PatientRecord[] = [
  // ── Active Patients (60) ──────────────────────────────────────────────────
  { name: 'Maria Gonzalez', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-15', phone: '(555) 201-0101', email: 'maria.gonzalez@email.com', dob: '1978-03-22', insuranceProvider: 'Blue Cross' },
  { name: 'James Washington', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-03', phone: '(555) 201-0102', email: 'james.washington@email.com', dob: '1955-11-14', insuranceProvider: 'Medicare' },
  { name: 'Yuki Tanaka', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-09-20', phone: '(555) 201-0103', email: 'yuki.tanaka@email.com', dob: '1982-06-30', insuranceProvider: 'Aetna' },
  { name: 'Amara Okafor', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-10-01', phone: '(555) 201-0104', email: 'amara.okafor@email.com', dob: '2018-02-15', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Robert Kim', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2025-06-10', phone: '(555) 201-0105', email: 'robert.kim@email.com', dob: '1965-09-08', insuranceProvider: 'Blue Cross' },
  { name: 'Sofia Herrera', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-22', phone: '(555) 201-0106', email: 'sofia.herrera@email.com', dob: '1960-12-03', insuranceProvider: 'Cigna' },
  { name: 'DeShawn Jackson', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-15', phone: '(555) 201-0107', email: 'deshawn.jackson@email.com', dob: '1990-04-17', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Priya Sharma', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-09-05', phone: '(555) 201-0108', email: 'priya.sharma@email.com', dob: '2015-08-21', insuranceProvider: 'Aetna' },
  { name: 'William Chen', specialty: 'Primary Care', status: 'Active', insuranceVerified: false, firstAppointment: '2025-11-12', phone: '(555) 201-0109', email: 'william.chen@email.com', dob: '1972-01-30', insuranceProvider: 'Blue Cross' },
  { name: 'Angela Davis', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-01', phone: '(555) 201-0110', email: 'angela.davis@email.com', dob: '1948-07-19', insuranceProvider: 'Medicare' },
  { name: 'Miguel Torres', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-10-18', phone: '(555) 201-0111', email: 'miguel.torres@email.com', dob: '1985-05-26', insuranceProvider: 'Cigna' },
  { name: 'Hannah Park', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-28', phone: '(555) 201-0112', email: 'hannah.park@email.com', dob: '2020-01-09', insuranceProvider: 'Blue Cross' },
  { name: 'Carlos Mendez', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2025-12-05', phone: '(555) 201-0113', email: 'carlos.mendez@email.com', dob: '1958-10-11', insuranceProvider: 'Medicaid' },
  { name: 'Fatima Al-Hassan', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2026-01-08', phone: '(555) 201-0114', email: 'fatima.alhassan@email.com', dob: '1963-04-05', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Patrick O\'Brien', specialty: 'Orthopedics', status: 'Active', insuranceVerified: false, firstAppointment: '2025-11-22', phone: '(555) 201-0115', email: 'patrick.obrien@email.com', dob: '1975-08-14', insuranceProvider: 'Aetna' },
  { name: 'Keiko Yamamoto', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-06-25', phone: '(555) 201-0116', email: 'keiko.yamamoto@email.com', dob: '2017-11-30', insuranceProvider: 'Blue Cross' },
  { name: 'Terrence Williams', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-02-14', phone: '(555) 201-0117', email: 'terrence.williams@email.com', dob: '1969-02-28', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Rosa Delgado', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-30', phone: '(555) 201-0118', email: 'rosa.delgado@email.com', dob: '1952-06-17', insuranceProvider: 'Medicare' },
  { name: 'Kwame Asante', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-09-14', phone: '(555) 201-0119', email: 'kwame.asante@email.com', dob: '1988-12-01', insuranceProvider: 'Cigna' },
  { name: 'Lily Tran', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-10-30', phone: '(555) 201-0120', email: 'lily.tran@email.com', dob: '2019-05-18', insuranceProvider: 'Medicaid' },
  { name: 'George Papadopoulos', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-08', phone: '(555) 201-0121', email: 'george.p@email.com', dob: '1945-03-09', insuranceProvider: 'Medicare' },
  { name: 'Aaliyah Robinson', specialty: 'Cardiology', status: 'Active', insuranceVerified: false, firstAppointment: '2026-01-22', phone: '(555) 201-0122', email: 'aaliyah.robinson@email.com', dob: '1970-09-25', insuranceProvider: 'Blue Cross' },
  { name: 'Hiroshi Nakamura', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-12-18', phone: '(555) 201-0123', email: 'hiroshi.n@email.com', dob: '1980-07-12', insuranceProvider: 'Aetna' },
  { name: 'Elena Petrov', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-06-15', phone: '(555) 201-0124', email: 'elena.petrov@email.com', dob: '2016-10-04', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Anthony Martinez', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-03-01', phone: '(555) 201-0125', email: 'anthony.martinez@email.com', dob: '1983-01-19', insuranceProvider: 'Cigna' },
  { name: 'Cynthia Blackwell', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-09-28', phone: '(555) 201-0126', email: 'cynthia.b@email.com', dob: '1957-05-31', insuranceProvider: 'Medicare' },
  { name: 'Raj Patel', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-10', phone: '(555) 201-0127', email: 'raj.patel@email.com', dob: '1992-08-07', insuranceProvider: 'Blue Cross' },
  { name: 'Isabella Cruz', specialty: 'Pediatrics', status: 'Active', insuranceVerified: false, firstAppointment: '2025-11-05', phone: '(555) 201-0128', email: 'isabella.cruz@email.com', dob: '2014-12-22', insuranceProvider: 'Medicaid' },
  { name: 'Samuel Okonkwo', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-02-28', phone: '(555) 201-0129', email: 'samuel.okonkwo@email.com', dob: '1976-04-13', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Catherine Nguyen', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-20', phone: '(555) 201-0130', email: 'catherine.nguyen@email.com', dob: '1961-11-08', insuranceProvider: 'Aetna' },
  { name: 'Brian Murphy', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-10-10', phone: '(555) 201-0131', email: 'brian.murphy@email.com', dob: '1987-03-15', insuranceProvider: 'Blue Cross' },
  { name: 'Zara Ahmed', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2026-01-14', phone: '(555) 201-0132', email: 'zara.ahmed@email.com', dob: '2020-06-28', insuranceProvider: 'Cigna' },
  { name: 'Thomas Jefferson III', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2025-12-01', phone: '(555) 201-0133', email: 'thomas.jefferson@email.com', dob: '1950-08-30', insuranceProvider: 'Medicare' },
  { name: 'Lucia Fernandez', specialty: 'Cardiology', status: 'Active', insuranceVerified: false, firstAppointment: '2026-03-15', phone: '(555) 201-0134', email: 'lucia.fernandez@email.com', dob: '1966-02-10', insuranceProvider: 'Blue Cross' },
  { name: 'Min-Jun Park', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-05', phone: '(555) 201-0135', email: 'minjun.park@email.com', dob: '1993-09-22', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Destiny Harris', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-09-09', phone: '(555) 201-0136', email: 'destiny.harris@email.com', dob: '2017-04-16', insuranceProvider: 'Medicaid' },
  { name: 'Viktor Petersen', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-04-10', phone: '(555) 201-0137', email: 'viktor.petersen@email.com', dob: '1973-07-04', insuranceProvider: 'Aetna' },
  { name: 'Jasmine Thompson', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-11-18', phone: '(555) 201-0138', email: 'jasmine.thompson@email.com', dob: '1959-01-27', insuranceProvider: 'Cigna' },
  { name: 'Omar Farah', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2026-02-05', phone: '(555) 201-0139', email: 'omar.farah@email.com', dob: '1984-10-19', insuranceProvider: 'Blue Cross' },
  { name: 'Mei-Ling Wu', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-06-30', phone: '(555) 201-0140', email: 'meiling.wu@email.com', dob: '2019-08-11', insuranceProvider: 'Aetna' },
  { name: 'Marcus Johnson', specialty: 'Primary Care', status: 'Active', insuranceVerified: false, firstAppointment: '2026-05-12', phone: '(555) 201-0141', email: 'marcus.johnson@email.com', dob: '1981-06-14', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Anika Gupta', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-10-25', phone: '(555) 201-0142', email: 'anika.gupta@email.com', dob: '1954-03-08', insuranceProvider: 'Medicare' },
  { name: 'Trevor Williamson', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2026-01-30', phone: '(555) 201-0143', email: 'trevor.w@email.com', dob: '1991-12-06', insuranceProvider: 'Blue Cross' },
  { name: 'Camila Reyes', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-12', phone: '(555) 201-0144', email: 'camila.reyes@email.com', dob: '2016-05-23', insuranceProvider: 'Cigna' },
  { name: 'Paul Andersen', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-03-20', phone: '(555) 201-0145', email: 'paul.andersen@email.com', dob: '1968-11-02', insuranceProvider: 'Aetna' },
  { name: 'Latasha Brown', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-12-15', phone: '(555) 201-0146', email: 'latasha.brown@email.com', dob: '1962-08-18', insuranceProvider: 'UnitedHealthcare' },
  { name: 'David Kowalski', specialty: 'Orthopedics', status: 'Active', insuranceVerified: false, firstAppointment: '2026-04-22', phone: '(555) 201-0147', email: 'david.kowalski@email.com', dob: '1979-02-05', insuranceProvider: 'Blue Cross' },
  { name: 'Nadia Ibrahim', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-18', phone: '(555) 201-0148', email: 'nadia.ibrahim@email.com', dob: '2018-09-14', insuranceProvider: 'Medicaid' },
  { name: 'Frank Romano', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-05-30', phone: '(555) 201-0149', email: 'frank.romano@email.com', dob: '1946-12-25', insuranceProvider: 'Medicare' },
  { name: 'Suki Watanabe', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-11-02', phone: '(555) 201-0150', email: 'suki.watanabe@email.com', dob: '1971-05-09', insuranceProvider: 'Cigna' },
  { name: 'Jerome Baptiste', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2026-02-18', phone: '(555) 201-0151', email: 'jerome.baptiste@email.com', dob: '1986-07-21', insuranceProvider: 'Aetna' },
  { name: 'Valentina Morales', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-09-22', phone: '(555) 201-0152', email: 'valentina.m@email.com', dob: '2015-03-10', insuranceProvider: 'Blue Cross' },
  { name: 'Henry Chang', specialty: 'Primary Care', status: 'Active', insuranceVerified: false, firstAppointment: '2026-06-08', phone: '(555) 201-0153', email: 'henry.chang@email.com', dob: '1974-10-31', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Dorothy Lewis', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-08-25', phone: '(555) 201-0154', email: 'dorothy.lewis@email.com', dob: '1949-04-20', insuranceProvider: 'Medicare' },
  { name: 'Emmanuel Osei', specialty: 'Orthopedics', status: 'Active', insuranceVerified: true, firstAppointment: '2026-03-10', phone: '(555) 201-0155', email: 'emmanuel.osei@email.com', dob: '1995-01-15', insuranceProvider: 'Blue Cross' },
  { name: 'Grace Kim', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-10-14', phone: '(555) 201-0156', email: 'grace.kim@email.com', dob: '2020-11-05', insuranceProvider: 'Aetna' },
  { name: 'Ricardo Flores', specialty: 'Primary Care', status: 'Active', insuranceVerified: true, firstAppointment: '2026-04-28', phone: '(555) 201-0157', email: 'ricardo.flores@email.com', dob: '1967-06-22', insuranceProvider: 'Cigna' },
  { name: 'Tanya Ivanova', specialty: 'Cardiology', status: 'Active', insuranceVerified: true, firstAppointment: '2025-12-28', phone: '(555) 201-0158', email: 'tanya.ivanova@email.com', dob: '1956-09-13', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Sean O\'Connor', specialty: 'Orthopedics', status: 'Active', insuranceVerified: false, firstAppointment: '2026-05-15', phone: '(555) 201-0159', email: 'sean.oconnor@email.com', dob: '1989-11-28', insuranceProvider: 'Aetna' },
  { name: 'Leila Haddad', specialty: 'Pediatrics', status: 'Active', insuranceVerified: true, firstAppointment: '2025-07-28', phone: '(555) 201-0160', email: 'leila.haddad@email.com', dob: '2017-02-07', insuranceProvider: 'Medicaid' },

  // ── Intake In Progress (15) ───────────────────────────────────────────────
  { name: 'Diana Castillo', specialty: 'Primary Care', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-04-15', phone: '(555) 301-0001', email: 'diana.castillo@email.com', dob: '1977-05-12', insuranceProvider: 'Blue Cross' },
  { name: 'Ronald Chapman', specialty: 'Cardiology', status: 'Intake', insuranceVerified: false, firstAppointment: '2026-04-18', phone: '(555) 301-0002', email: 'ronald.chapman@email.com', dob: '1953-08-29', insuranceProvider: 'Medicare' },
  { name: 'Ji-Yeon Lee', specialty: 'Orthopedics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-04-20', phone: '(555) 301-0003', email: 'jiyeon.lee@email.com', dob: '1986-01-17', insuranceProvider: 'Aetna' },
  { name: 'Marcus Green', specialty: 'Pediatrics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-04-22', phone: '(555) 301-0004', email: 'marcus.green@email.com', dob: '2019-07-04', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Olga Sokolova', specialty: 'Primary Care', status: 'Intake', insuranceVerified: false, firstAppointment: '2026-04-25', phone: '(555) 301-0005', email: 'olga.sokolova@email.com', dob: '1964-12-09', insuranceProvider: 'Cigna' },
  { name: 'Hassan Abdi', specialty: 'Cardiology', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-04-28', phone: '(555) 301-0006', email: 'hassan.abdi@email.com', dob: '1960-03-21', insuranceProvider: 'Blue Cross' },
  { name: 'Tameka Johnson', specialty: 'Orthopedics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-01', phone: '(555) 301-0007', email: 'tameka.johnson@email.com', dob: '1991-10-30', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Sanjay Mehta', specialty: 'Pediatrics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-05', phone: '(555) 301-0008', email: 'sanjay.mehta@email.com', dob: '2016-04-18', insuranceProvider: 'Aetna' },
  { name: 'Linda Fitzgerald', specialty: 'Primary Care', status: 'Intake', insuranceVerified: false, firstAppointment: '2026-05-08', phone: '(555) 301-0009', email: 'linda.fitzgerald@email.com', dob: '1970-09-06', insuranceProvider: 'Blue Cross' },
  { name: 'Wei Zhang', specialty: 'Cardiology', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-12', phone: '(555) 301-0010', email: 'wei.zhang@email.com', dob: '1958-06-24', insuranceProvider: 'Medicare' },
  { name: 'Gabriela Vega', specialty: 'Orthopedics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-15', phone: '(555) 301-0011', email: 'gabriela.vega@email.com', dob: '1983-02-11', insuranceProvider: 'Cigna' },
  { name: 'Aaron Mitchell', specialty: 'Pediatrics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-18', phone: '(555) 301-0012', email: 'aaron.mitchell@email.com', dob: '2020-08-15', insuranceProvider: 'Medicaid' },
  { name: 'Nkechi Eze', specialty: 'Primary Care', status: 'Intake', insuranceVerified: false, firstAppointment: '2026-05-22', phone: '(555) 301-0013', email: 'nkechi.eze@email.com', dob: '1975-11-03', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Ivan Kovalenko', specialty: 'Cardiology', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-25', phone: '(555) 301-0014', email: 'ivan.kovalenko@email.com', dob: '1951-07-20', insuranceProvider: 'Aetna' },
  { name: 'Sandra Reyes', specialty: 'Orthopedics', status: 'Intake', insuranceVerified: true, firstAppointment: '2026-05-28', phone: '(555) 301-0015', email: 'sandra.reyes@email.com', dob: '1994-05-08', insuranceProvider: 'Blue Cross' },

  // ── New Patients (15) ─────────────────────────────────────────────────────
  { name: 'Philip Oduro', specialty: 'Primary Care', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-01', phone: '(555) 401-0001', email: 'philip.oduro@email.com', dob: '1980-03-14', insuranceProvider: 'Cigna' },
  { name: 'Amy Nakamura', specialty: 'Cardiology', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-05', phone: '(555) 401-0002', email: 'amy.nakamura@email.com', dob: '1963-10-28', insuranceProvider: 'Blue Cross' },
  { name: 'Jamal Brown', specialty: 'Orthopedics', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-08', phone: '(555) 401-0003', email: 'jamal.brown@email.com', dob: '1997-07-22', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Ananya Reddy', specialty: 'Pediatrics', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-10', phone: '(555) 401-0004', email: 'ananya.reddy@email.com', dob: '2021-01-05', insuranceProvider: 'Aetna' },
  { name: 'Laura Schmidt', specialty: 'Primary Care', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-12', phone: '(555) 401-0005', email: 'laura.schmidt@email.com', dob: '1971-08-17', insuranceProvider: 'Medicare' },
  { name: 'Darnell Washington', specialty: 'Cardiology', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-15', phone: '(555) 401-0006', email: 'darnell.w@email.com', dob: '1955-04-01', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Tomoko Sato', specialty: 'Orthopedics', status: 'New', insuranceVerified: true, firstAppointment: '2026-06-18', phone: '(555) 401-0007', email: 'tomoko.sato@email.com', dob: '1988-12-10', insuranceProvider: 'Blue Cross' },
  { name: 'Esperanza Lopez', specialty: 'Pediatrics', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-20', phone: '(555) 401-0008', email: 'esperanza.lopez@email.com', dob: '2018-06-30', insuranceProvider: 'Medicaid' },
  { name: 'Stephen Clarke', specialty: 'Primary Care', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-22', phone: '(555) 401-0009', email: 'stephen.clarke@email.com', dob: '1966-02-24', insuranceProvider: 'Cigna' },
  { name: 'Adaeze Nwosu', specialty: 'Cardiology', status: 'New', insuranceVerified: true, firstAppointment: '2026-06-24', phone: '(555) 401-0010', email: 'adaeze.nwosu@email.com', dob: '1960-11-15', insuranceProvider: 'Aetna' },
  { name: 'Yusuf Diallo', specialty: 'Orthopedics', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-26', phone: '(555) 401-0011', email: 'yusuf.diallo@email.com', dob: '1996-04-09', insuranceProvider: 'Blue Cross' },
  { name: 'Mia Santos', specialty: 'Pediatrics', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-28', phone: '(555) 401-0012', email: 'mia.santos@email.com', dob: '2020-09-19', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Donald Fraser', specialty: 'Primary Care', status: 'New', insuranceVerified: true, firstAppointment: '2026-06-30', phone: '(555) 401-0013', email: 'donald.fraser@email.com', dob: '1947-05-26', insuranceProvider: 'Medicare' },
  { name: 'Sunita Kapoor', specialty: 'Cardiology', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-15', phone: '(555) 401-0014', email: 'sunita.kapoor@email.com', dob: '1968-01-13', insuranceProvider: 'Cigna' },
  { name: 'Andre Powell', specialty: 'Orthopedics', status: 'New', insuranceVerified: false, firstAppointment: '2026-06-20', phone: '(555) 401-0015', email: 'andre.powell@email.com', dob: '1990-08-05', insuranceProvider: 'Medicaid' },

  // ── Discharged (10) ───────────────────────────────────────────────────────
  { name: 'Margaret Chen', specialty: 'Primary Care', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-06-01', phone: '(555) 501-0001', email: 'margaret.chen@email.com', dob: '1952-04-15', insuranceProvider: 'Medicare' },
  { name: 'Richard Taylor', specialty: 'Cardiology', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-06-10', phone: '(555) 501-0002', email: 'richard.taylor@email.com', dob: '1958-09-28', insuranceProvider: 'Aetna' },
  { name: 'Yolanda Rivera', specialty: 'Orthopedics', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-07-05', phone: '(555) 501-0003', email: 'yolanda.rivera@email.com', dob: '1976-11-22', insuranceProvider: 'Blue Cross' },
  { name: 'Kenneth Owusu', specialty: 'Pediatrics', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-06-20', phone: '(555) 501-0004', email: 'kenneth.owusu@email.com', dob: '2014-03-08', insuranceProvider: 'UnitedHealthcare' },
  { name: 'Betty Johansson', specialty: 'Primary Care', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-08-14', phone: '(555) 501-0005', email: 'betty.johansson@email.com', dob: '1945-07-30', insuranceProvider: 'Medicare' },
  { name: 'Alejandro Ruiz', specialty: 'Cardiology', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-07-22', phone: '(555) 501-0006', email: 'alejandro.ruiz@email.com', dob: '1964-10-05', insuranceProvider: 'Cigna' },
  { name: 'Hana Yoshida', specialty: 'Orthopedics', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-09-01', phone: '(555) 501-0007', email: 'hana.yoshida@email.com', dob: '1985-06-18', insuranceProvider: 'Blue Cross' },
  { name: 'Curtis Washington', specialty: 'Pediatrics', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-08-05', phone: '(555) 501-0008', email: 'curtis.w@email.com', dob: '2013-12-01', insuranceProvider: 'Medicaid' },
  { name: 'Ingrid Larsen', specialty: 'Primary Care', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-10-18', phone: '(555) 501-0009', email: 'ingrid.larsen@email.com', dob: '1969-02-14', insuranceProvider: 'Aetna' },
  { name: 'Kofi Mensah', specialty: 'Cardiology', status: 'Discharged', insuranceVerified: true, firstAppointment: '2025-09-25', phone: '(555) 501-0010', email: 'kofi.mensah@email.com', dob: '1957-08-09', insuranceProvider: 'UnitedHealthcare' },
];

// ─── Appointment Data ───────────────────────────────────────────────────────

interface AppointmentRecord {
  patientName: string;
  providerIndex: number;
  dateTime: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'No-Show' | 'Cancelled';
  chiefComplaint: string;
  specialty: string;
  room: string;
  duration: number;
}

const APPOINTMENTS: AppointmentRecord[] = [
  // ── Completed (30) — past dates: 2025-12-01 to 2026-03-31 ────────────────
  { patientName: 'Maria Gonzalez', providerIndex: 0, dateTime: '2025-12-01T09:00:00', status: 'Completed', chiefComplaint: 'Annual physical', specialty: 'Primary Care', room: 'Room 101', duration: 30 },
  { patientName: 'James Washington', providerIndex: 1, dateTime: '2025-12-03T10:30:00', status: 'Completed', chiefComplaint: 'Chest pain', specialty: 'Cardiology', room: 'Room 102', duration: 45 },
  { patientName: 'Yuki Tanaka', providerIndex: 2, dateTime: '2025-12-05T14:00:00', status: 'Completed', chiefComplaint: 'Knee pain', specialty: 'Orthopedics', room: 'Room 103', duration: 30 },
  { patientName: 'Amara Okafor', providerIndex: 3, dateTime: '2025-12-08T11:00:00', status: 'Completed', chiefComplaint: 'Well-child visit', specialty: 'Pediatrics', room: 'Room 104', duration: 30 },
  { patientName: 'Robert Kim', providerIndex: 4, dateTime: '2025-12-10T08:30:00', status: 'Completed', chiefComplaint: 'Follow-up: hypertension', specialty: 'Primary Care', room: 'Room 105', duration: 15 },
  { patientName: 'Sofia Herrera', providerIndex: 5, dateTime: '2025-12-12T13:00:00', status: 'Completed', chiefComplaint: 'Heart palpitations', specialty: 'Cardiology', room: 'Room 106', duration: 45 },
  { patientName: 'DeShawn Jackson', providerIndex: 6, dateTime: '2025-12-15T10:00:00', status: 'Completed', chiefComplaint: 'Back pain', specialty: 'Orthopedics', room: 'Room 107', duration: 30 },
  { patientName: 'Priya Sharma', providerIndex: 7, dateTime: '2025-12-17T09:30:00', status: 'Completed', chiefComplaint: 'Growth assessment', specialty: 'Pediatrics', room: 'Room 108', duration: 30 },
  { patientName: 'William Chen', providerIndex: 8, dateTime: '2025-12-20T11:30:00', status: 'Completed', chiefComplaint: 'Diabetes management', specialty: 'Primary Care', room: 'Room 101', duration: 30 },
  { patientName: 'Angela Davis', providerIndex: 9, dateTime: '2026-01-05T10:00:00', status: 'Completed', chiefComplaint: 'Shortness of breath', specialty: 'Cardiology', room: 'Room 102', duration: 60 },
  { patientName: 'Miguel Torres', providerIndex: 10, dateTime: '2026-01-08T14:30:00', status: 'Completed', chiefComplaint: 'Joint stiffness', specialty: 'Orthopedics', room: 'Room 103', duration: 30 },
  { patientName: 'Hannah Park', providerIndex: 11, dateTime: '2026-01-10T09:00:00', status: 'Completed', chiefComplaint: 'Fever and cough', specialty: 'Pediatrics', room: 'Room 104', duration: 30 },
  { patientName: 'Carlos Mendez', providerIndex: 0, dateTime: '2026-01-15T08:00:00', status: 'Completed', chiefComplaint: 'Annual physical', specialty: 'Primary Care', room: 'Room 105', duration: 30 },
  { patientName: 'Fatima Al-Hassan', providerIndex: 1, dateTime: '2026-01-18T11:00:00', status: 'Completed', chiefComplaint: 'Atrial fibrillation follow-up', specialty: 'Cardiology', room: 'Room 106', duration: 45 },
  { patientName: 'Patrick O\'Brien', providerIndex: 2, dateTime: '2026-01-22T13:30:00', status: 'Completed', chiefComplaint: 'Shoulder pain', specialty: 'Orthopedics', room: 'Room 107', duration: 30 },
  { patientName: 'Keiko Yamamoto', providerIndex: 3, dateTime: '2026-01-25T10:00:00', status: 'Completed', chiefComplaint: 'Immunization visit', specialty: 'Pediatrics', room: 'Room 108', duration: 15 },
  { patientName: 'Terrence Williams', providerIndex: 4, dateTime: '2026-02-01T09:30:00', status: 'Completed', chiefComplaint: 'Follow-up: hypertension', specialty: 'Primary Care', room: 'Room 101', duration: 15 },
  { patientName: 'Rosa Delgado', providerIndex: 5, dateTime: '2026-02-05T10:30:00', status: 'Completed', chiefComplaint: 'Chest pain evaluation', specialty: 'Cardiology', room: 'Room 102', duration: 60 },
  { patientName: 'Kwame Asante', providerIndex: 6, dateTime: '2026-02-10T14:00:00', status: 'Completed', chiefComplaint: 'Hip pain', specialty: 'Orthopedics', room: 'Room 103', duration: 30 },
  { patientName: 'Lily Tran', providerIndex: 7, dateTime: '2026-02-12T11:00:00', status: 'Completed', chiefComplaint: 'Ear infection', specialty: 'Pediatrics', room: 'Room 104', duration: 15 },
  { patientName: 'George Papadopoulos', providerIndex: 8, dateTime: '2026-02-18T08:30:00', status: 'Completed', chiefComplaint: 'Chronic pain management', specialty: 'Primary Care', room: 'Room 105', duration: 30 },
  { patientName: 'Aaliyah Robinson', providerIndex: 9, dateTime: '2026-02-22T13:00:00', status: 'Completed', chiefComplaint: 'EKG follow-up', specialty: 'Cardiology', room: 'Room 106', duration: 30 },
  { patientName: 'Hiroshi Nakamura', providerIndex: 10, dateTime: '2026-02-25T10:30:00', status: 'Completed', chiefComplaint: 'Post-surgical follow-up', specialty: 'Orthopedics', room: 'Room 107', duration: 30 },
  { patientName: 'Elena Petrov', providerIndex: 11, dateTime: '2026-03-01T09:00:00', status: 'Completed', chiefComplaint: 'Well-child visit', specialty: 'Pediatrics', room: 'Room 108', duration: 30 },
  { patientName: 'Anthony Martinez', providerIndex: 0, dateTime: '2026-03-05T11:30:00', status: 'Completed', chiefComplaint: 'Headache evaluation', specialty: 'Primary Care', room: 'Room 101', duration: 30 },
  { patientName: 'Cynthia Blackwell', providerIndex: 1, dateTime: '2026-03-10T10:00:00', status: 'Completed', chiefComplaint: 'Blood pressure monitoring', specialty: 'Cardiology', room: 'Room 102', duration: 30 },
  { patientName: 'Raj Patel', providerIndex: 2, dateTime: '2026-03-15T14:00:00', status: 'Completed', chiefComplaint: 'Wrist fracture follow-up', specialty: 'Orthopedics', room: 'Room 103', duration: 15 },
  { patientName: 'Isabella Cruz', providerIndex: 3, dateTime: '2026-03-18T09:30:00', status: 'Completed', chiefComplaint: 'Asthma management', specialty: 'Pediatrics', room: 'Room 104', duration: 30 },
  { patientName: 'Samuel Okonkwo', providerIndex: 4, dateTime: '2026-03-22T08:00:00', status: 'Completed', chiefComplaint: 'Annual physical', specialty: 'Primary Care', room: 'Room 105', duration: 30 },
  { patientName: 'Catherine Nguyen', providerIndex: 5, dateTime: '2026-03-28T10:30:00', status: 'Completed', chiefComplaint: 'Stress test follow-up', specialty: 'Cardiology', room: 'Room 106', duration: 45 },

  // ── Scheduled (10) — upcoming: 2026-04-03 to 2026-06-30 ──────────────────
  { patientName: 'Brian Murphy', providerIndex: 6, dateTime: '2026-04-05T10:00:00', status: 'Scheduled', chiefComplaint: 'Knee replacement consultation', specialty: 'Orthopedics', room: 'Room 107', duration: 45 },
  { patientName: 'Zara Ahmed', providerIndex: 7, dateTime: '2026-04-08T09:00:00', status: 'Scheduled', chiefComplaint: 'Well-child visit', specialty: 'Pediatrics', room: 'Room 108', duration: 30 },
  { patientName: 'Thomas Jefferson III', providerIndex: 8, dateTime: '2026-04-12T11:00:00', status: 'Scheduled', chiefComplaint: 'Diabetes management', specialty: 'Primary Care', room: 'Room 101', duration: 30 },
  { patientName: 'Lucia Fernandez', providerIndex: 9, dateTime: '2026-04-18T13:30:00', status: 'Scheduled', chiefComplaint: 'Heart palpitations', specialty: 'Cardiology', room: 'Room 102', duration: 45 },
  { patientName: 'Min-Jun Park', providerIndex: 10, dateTime: '2026-04-22T14:00:00', status: 'Scheduled', chiefComplaint: 'Ankle sprain follow-up', specialty: 'Orthopedics', room: 'Room 103', duration: 15 },
  { patientName: 'Destiny Harris', providerIndex: 11, dateTime: '2026-05-01T10:30:00', status: 'Scheduled', chiefComplaint: 'Growth assessment', specialty: 'Pediatrics', room: 'Room 104', duration: 30 },
  { patientName: 'Viktor Petersen', providerIndex: 0, dateTime: '2026-05-10T08:30:00', status: 'Scheduled', chiefComplaint: 'Annual physical', specialty: 'Primary Care', room: 'Room 105', duration: 30 },
  { patientName: 'Jasmine Thompson', providerIndex: 1, dateTime: '2026-05-18T11:00:00', status: 'Scheduled', chiefComplaint: 'Echocardiogram review', specialty: 'Cardiology', room: 'Room 106', duration: 60 },
  { patientName: 'Omar Farah', providerIndex: 2, dateTime: '2026-06-02T13:00:00', status: 'Scheduled', chiefComplaint: 'Back pain evaluation', specialty: 'Orthopedics', room: 'Room 107', duration: 30 },
  { patientName: 'Mei-Ling Wu', providerIndex: 3, dateTime: '2026-06-15T09:00:00', status: 'Scheduled', chiefComplaint: 'Fever and cough', specialty: 'Pediatrics', room: 'Room 108', duration: 30 },

  // ── Confirmed (10) — upcoming: 2026-04-03 to 2026-06-30 ──────────────────
  { patientName: 'Marcus Johnson', providerIndex: 4, dateTime: '2026-04-03T09:00:00', status: 'Confirmed', chiefComplaint: 'Follow-up: hypertension', specialty: 'Primary Care', room: 'Room 101', duration: 15 },
  { patientName: 'Anika Gupta', providerIndex: 5, dateTime: '2026-04-07T10:30:00', status: 'Confirmed', chiefComplaint: 'Atrial fibrillation monitoring', specialty: 'Cardiology', room: 'Room 102', duration: 45 },
  { patientName: 'Trevor Williamson', providerIndex: 6, dateTime: '2026-04-10T14:00:00', status: 'Confirmed', chiefComplaint: 'Rotator cuff evaluation', specialty: 'Orthopedics', room: 'Room 103', duration: 30 },
  { patientName: 'Camila Reyes', providerIndex: 7, dateTime: '2026-04-14T11:00:00', status: 'Confirmed', chiefComplaint: 'Immunization visit', specialty: 'Pediatrics', room: 'Room 104', duration: 15 },
  { patientName: 'Paul Andersen', providerIndex: 8, dateTime: '2026-04-20T08:30:00', status: 'Confirmed', chiefComplaint: 'Chronic pain management', specialty: 'Primary Care', room: 'Room 105', duration: 30 },
  { patientName: 'Latasha Brown', providerIndex: 9, dateTime: '2026-04-25T13:00:00', status: 'Confirmed', chiefComplaint: 'Blood pressure monitoring', specialty: 'Cardiology', room: 'Room 106', duration: 30 },
  { patientName: 'David Kowalski', providerIndex: 10, dateTime: '2026-05-05T10:00:00', status: 'Confirmed', chiefComplaint: 'Joint stiffness', specialty: 'Orthopedics', room: 'Room 107', duration: 30 },
  { patientName: 'Nadia Ibrahim', providerIndex: 11, dateTime: '2026-05-12T09:30:00', status: 'Confirmed', chiefComplaint: 'Ear infection follow-up', specialty: 'Pediatrics', room: 'Room 108', duration: 15 },
  { patientName: 'Frank Romano', providerIndex: 0, dateTime: '2026-05-20T11:00:00', status: 'Confirmed', chiefComplaint: 'Annual physical', specialty: 'Primary Care', room: 'Room 101', duration: 30 },
  { patientName: 'Suki Watanabe', providerIndex: 1, dateTime: '2026-06-10T10:00:00', status: 'Confirmed', chiefComplaint: 'Chest pain evaluation', specialty: 'Cardiology', room: 'Room 102', duration: 60 },

  // ── No-Show (5) — past dates ──────────────────────────────────────────────
  { patientName: 'Jerome Baptiste', providerIndex: 2, dateTime: '2026-01-12T14:30:00', status: 'No-Show', chiefComplaint: 'Hip pain follow-up', specialty: 'Orthopedics', room: 'Room 103', duration: 30 },
  { patientName: 'Valentina Morales', providerIndex: 3, dateTime: '2026-02-08T09:00:00', status: 'No-Show', chiefComplaint: 'Well-child visit', specialty: 'Pediatrics', room: 'Room 104', duration: 30 },
  { patientName: 'Henry Chang', providerIndex: 4, dateTime: '2026-02-20T11:30:00', status: 'No-Show', chiefComplaint: 'Follow-up: diabetes', specialty: 'Primary Care', room: 'Room 105', duration: 30 },
  { patientName: 'Dorothy Lewis', providerIndex: 5, dateTime: '2026-03-02T10:00:00', status: 'No-Show', chiefComplaint: 'Stress test', specialty: 'Cardiology', room: 'Room 106', duration: 60 },
  { patientName: 'Emmanuel Osei', providerIndex: 6, dateTime: '2026-03-20T13:00:00', status: 'No-Show', chiefComplaint: 'Back pain', specialty: 'Orthopedics', room: 'Room 107', duration: 30 },

  // ── Cancelled (5) — past dates ────────────────────────────────────────────
  { patientName: 'Grace Kim', providerIndex: 7, dateTime: '2026-01-20T09:30:00', status: 'Cancelled', chiefComplaint: 'Well-child visit', specialty: 'Pediatrics', room: 'Room 108', duration: 30 },
  { patientName: 'Ricardo Flores', providerIndex: 8, dateTime: '2026-02-15T08:00:00', status: 'Cancelled', chiefComplaint: 'Annual physical', specialty: 'Primary Care', room: 'Room 101', duration: 30 },
  { patientName: 'Tanya Ivanova', providerIndex: 9, dateTime: '2026-03-05T11:00:00', status: 'Cancelled', chiefComplaint: 'Echocardiogram', specialty: 'Cardiology', room: 'Room 102', duration: 60 },
  { patientName: 'Sean O\'Connor', providerIndex: 10, dateTime: '2026-03-12T14:30:00', status: 'Cancelled', chiefComplaint: 'MRI review', specialty: 'Orthopedics', room: 'Room 103', duration: 30 },
  { patientName: 'Leila Haddad', providerIndex: 11, dateTime: '2026-03-25T10:00:00', status: 'Cancelled', chiefComplaint: 'Fever and cough', specialty: 'Pediatrics', room: 'Room 104', duration: 15 },
];

// ─── Insurance Claims Data ──────────────────────────────────────────────────

interface ClaimRecord {
  claimNumber: string;
  patientName: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Denied' | 'Paid';
  amount: number;
  submittedDate: string;
  paymentDate: string | null;
  insuranceProvider: string;
  cptCode: string;
  diagnosis: string;
}

const CLAIMS: ClaimRecord[] = [
  // ── Submitted (10) ────────────────────────────────────────────────────────
  { claimNumber: 'CLM-2026-0001', patientName: 'Maria Gonzalez', status: 'Submitted', amount: 175.00, submittedDate: '2026-03-15', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99214', diagnosis: 'Essential hypertension' },
  { claimNumber: 'CLM-2026-0002', patientName: 'DeShawn Jackson', status: 'Submitted', amount: 350.00, submittedDate: '2026-03-18', paymentDate: null, insuranceProvider: 'UnitedHealthcare', cptCode: '99215', diagnosis: 'Low back pain' },
  { claimNumber: 'CLM-2026-0003', patientName: 'Priya Sharma', status: 'Submitted', amount: 125.00, submittedDate: '2026-03-20', paymentDate: null, insuranceProvider: 'Aetna', cptCode: '99392', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0004', patientName: 'Angela Davis', status: 'Submitted', amount: 850.00, submittedDate: '2026-03-22', paymentDate: null, insuranceProvider: 'Medicare', cptCode: '93306', diagnosis: 'Atrial fibrillation' },
  { claimNumber: 'CLM-2026-0005', patientName: 'Carlos Mendez', status: 'Submitted', amount: 150.00, submittedDate: '2026-03-24', paymentDate: null, insuranceProvider: 'Medicaid', cptCode: '99213', diagnosis: 'Type 2 diabetes' },
  { claimNumber: 'CLM-2026-0006', patientName: 'Kwame Asante', status: 'Submitted', amount: 475.00, submittedDate: '2026-03-25', paymentDate: null, insuranceProvider: 'Cigna', cptCode: '99215', diagnosis: 'Osteoarthritis knee' },
  { claimNumber: 'CLM-2026-0007', patientName: 'Terrence Williams', status: 'Submitted', amount: 95.00, submittedDate: '2026-03-26', paymentDate: null, insuranceProvider: 'UnitedHealthcare', cptCode: '99213', diagnosis: 'Essential hypertension' },
  { claimNumber: 'CLM-2026-0008', patientName: 'Lily Tran', status: 'Submitted', amount: 110.00, submittedDate: '2026-03-28', paymentDate: null, insuranceProvider: 'Medicaid', cptCode: '99383', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0009', patientName: 'George Papadopoulos', status: 'Submitted', amount: 200.00, submittedDate: '2026-03-29', paymentDate: null, insuranceProvider: 'Medicare', cptCode: '99214', diagnosis: 'GERD' },
  { claimNumber: 'CLM-2026-0010', patientName: 'Brian Murphy', status: 'Submitted', amount: 525.00, submittedDate: '2026-03-31', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99215', diagnosis: 'Osteoarthritis knee' },

  // ── Under Review (8) ──────────────────────────────────────────────────────
  { claimNumber: 'CLM-2026-0011', patientName: 'James Washington', status: 'Under Review', amount: 1250.00, submittedDate: '2026-03-01', paymentDate: null, insuranceProvider: 'Medicare', cptCode: '93000', diagnosis: 'Chest pain' },
  { claimNumber: 'CLM-2026-0012', patientName: 'Sofia Herrera', status: 'Under Review', amount: 780.00, submittedDate: '2026-03-05', paymentDate: null, insuranceProvider: 'Cigna', cptCode: '93306', diagnosis: 'Atrial fibrillation' },
  { claimNumber: 'CLM-2026-0013', patientName: 'Miguel Torres', status: 'Under Review', amount: 3200.00, submittedDate: '2026-02-28', paymentDate: null, insuranceProvider: 'Cigna', cptCode: '27447', diagnosis: 'Osteoarthritis knee' },
  { claimNumber: 'CLM-2026-0014', patientName: 'Hannah Park', status: 'Under Review', amount: 145.00, submittedDate: '2026-03-08', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99392', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0015', patientName: 'Fatima Al-Hassan', status: 'Under Review', amount: 925.00, submittedDate: '2026-03-10', paymentDate: null, insuranceProvider: 'UnitedHealthcare', cptCode: '93306', diagnosis: 'Atrial fibrillation' },
  { claimNumber: 'CLM-2026-0016', patientName: 'Rosa Delgado', status: 'Under Review', amount: 1600.00, submittedDate: '2026-02-25', paymentDate: null, insuranceProvider: 'Medicare', cptCode: '93000', diagnosis: 'Chest pain' },
  { claimNumber: 'CLM-2026-0017', patientName: 'Raj Patel', status: 'Under Review', amount: 420.00, submittedDate: '2026-03-12', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99215', diagnosis: 'Low back pain' },
  { claimNumber: 'CLM-2026-0018', patientName: 'Isabella Cruz', status: 'Under Review', amount: 185.00, submittedDate: '2026-03-14', paymentDate: null, insuranceProvider: 'Medicaid', cptCode: '99383', diagnosis: 'Asthma' },

  // ── Approved (10) ─────────────────────────────────────────────────────────
  { claimNumber: 'CLM-2026-0019', patientName: 'Robert Kim', status: 'Approved', amount: 175.00, submittedDate: '2026-02-01', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99214', diagnosis: 'Essential hypertension' },
  { claimNumber: 'CLM-2026-0020', patientName: 'Keiko Yamamoto', status: 'Approved', amount: 75.00, submittedDate: '2026-02-05', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99392', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0021', patientName: 'Patrick O\'Brien', status: 'Approved', amount: 2800.00, submittedDate: '2026-02-08', paymentDate: null, insuranceProvider: 'Aetna', cptCode: '27447', diagnosis: 'Osteoarthritis knee' },
  { claimNumber: 'CLM-2026-0022', patientName: 'William Chen', status: 'Approved', amount: 225.00, submittedDate: '2026-02-10', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99214', diagnosis: 'Type 2 diabetes' },
  { claimNumber: 'CLM-2026-0023', patientName: 'Aaliyah Robinson', status: 'Approved', amount: 680.00, submittedDate: '2026-02-12', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '93000', diagnosis: 'Chest pain' },
  { claimNumber: 'CLM-2026-0024', patientName: 'Elena Petrov', status: 'Approved', amount: 110.00, submittedDate: '2026-02-15', paymentDate: null, insuranceProvider: 'UnitedHealthcare', cptCode: '99392', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0025', patientName: 'Hiroshi Nakamura', status: 'Approved', amount: 4500.00, submittedDate: '2026-02-18', paymentDate: null, insuranceProvider: 'Aetna', cptCode: '27447', diagnosis: 'Osteoarthritis knee' },
  { claimNumber: 'CLM-2026-0026', patientName: 'Anthony Martinez', status: 'Approved', amount: 150.00, submittedDate: '2026-02-20', paymentDate: null, insuranceProvider: 'Cigna', cptCode: '99213', diagnosis: 'GERD' },
  { claimNumber: 'CLM-2026-0027', patientName: 'Cynthia Blackwell', status: 'Approved', amount: 750.00, submittedDate: '2026-02-22', paymentDate: null, insuranceProvider: 'Medicare', cptCode: '93306', diagnosis: 'Atrial fibrillation' },
  { claimNumber: 'CLM-2026-0028', patientName: 'Samuel Okonkwo', status: 'Approved', amount: 175.00, submittedDate: '2026-02-25', paymentDate: null, insuranceProvider: 'UnitedHealthcare', cptCode: '99214', diagnosis: 'Essential hypertension' },

  // ── Denied (5) ────────────────────────────────────────────────────────────
  { claimNumber: 'CLM-2026-0029', patientName: 'Catherine Nguyen', status: 'Denied', amount: 8500.00, submittedDate: '2026-01-10', paymentDate: null, insuranceProvider: 'Aetna', cptCode: '27447', diagnosis: 'Osteoarthritis knee' },
  { claimNumber: 'CLM-2026-0030', patientName: 'Valentina Morales', status: 'Denied', amount: 320.00, submittedDate: '2026-01-15', paymentDate: null, insuranceProvider: 'Blue Cross', cptCode: '99204', diagnosis: 'Acute bronchitis' },
  { claimNumber: 'CLM-2026-0031', patientName: 'Henry Chang', status: 'Denied', amount: 250.00, submittedDate: '2026-01-20', paymentDate: null, insuranceProvider: 'UnitedHealthcare', cptCode: '99214', diagnosis: 'Type 2 diabetes' },
  { claimNumber: 'CLM-2026-0032', patientName: 'Dorothy Lewis', status: 'Denied', amount: 1450.00, submittedDate: '2026-01-25', paymentDate: null, insuranceProvider: 'Medicare', cptCode: '93000', diagnosis: 'Chest pain' },
  { claimNumber: 'CLM-2026-0033', patientName: 'Jerome Baptiste', status: 'Denied', amount: 575.00, submittedDate: '2026-01-28', paymentDate: null, insuranceProvider: 'Aetna', cptCode: '99215', diagnosis: 'Low back pain' },

  // ── Paid (7) ──────────────────────────────────────────────────────────────
  { claimNumber: 'CLM-2026-0034', patientName: 'Yuki Tanaka', status: 'Paid', amount: 3800.00, submittedDate: '2025-12-05', paymentDate: '2026-01-15', insuranceProvider: 'Aetna', cptCode: '27447', diagnosis: 'Osteoarthritis knee' },
  { claimNumber: 'CLM-2026-0035', patientName: 'Amara Okafor', status: 'Paid', amount: 125.00, submittedDate: '2025-12-10', paymentDate: '2026-01-20', insuranceProvider: 'UnitedHealthcare', cptCode: '99392', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0036', patientName: 'Min-Jun Park', status: 'Paid', amount: 475.00, submittedDate: '2025-12-15', paymentDate: '2026-01-28', insuranceProvider: 'UnitedHealthcare', cptCode: '99215', diagnosis: 'Low back pain' },
  { claimNumber: 'CLM-2026-0037', patientName: 'Destiny Harris', status: 'Paid', amount: 95.00, submittedDate: '2025-12-20', paymentDate: '2026-02-01', insuranceProvider: 'Medicaid', cptCode: '99383', diagnosis: 'Well-child exam' },
  { claimNumber: 'CLM-2026-0038', patientName: 'Jasmine Thompson', status: 'Paid', amount: 920.00, submittedDate: '2026-01-05', paymentDate: '2026-02-10', insuranceProvider: 'Cigna', cptCode: '93306', diagnosis: 'Atrial fibrillation' },
  { claimNumber: 'CLM-2026-0039', patientName: 'Omar Farah', status: 'Paid', amount: 350.00, submittedDate: '2026-01-10', paymentDate: '2026-02-18', insuranceProvider: 'Blue Cross', cptCode: '99215', diagnosis: 'Low back pain' },
  { claimNumber: 'CLM-2026-0040', patientName: 'Mei-Ling Wu', status: 'Paid', amount: 110.00, submittedDate: '2026-01-15', paymentDate: '2026-02-25', insuranceProvider: 'Aetna', cptCode: '99383', diagnosis: 'Well-child exam' },
];

// ─── Status Color Mappings ──────────────────────────────────────────────────

const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  'Scheduled': '#60A5FA',
  'Confirmed': '#A78BFA',
  'Completed': '#34D399',
  'No-Show': '#F87171',
  'Cancelled': '#6B7280',
};

const CLAIM_STATUS_COLORS: Record<string, string> = {
  'Submitted': '#60A5FA',
  'Under Review': '#FCD34D',
  'Approved': '#34D399',
  'Denied': '#F87171',
  'Paid': '#059669',
};

// ─── Group Mapping Helpers ──────────────────────────────────────────────────

function getPatientGroup(status: string, groups: Record<string, number>): number {
  const mapping: Record<string, string> = {
    'New': 'New Patients',
    'Intake': 'Intake In Progress',
    'Active': 'Active Patients',
    'Discharged': 'Discharged',
  };
  return groups[mapping[status] || 'New Patients'];
}

function getAppointmentGroup(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Scheduled'];
}

function getClaimGroup(status: string, groups: Record<string, number>): number {
  return groups[status] || groups['Submitted'];
}

// ─── Seed Functions ─────────────────────────────────────────────────────────

async function seedPatients(
  ctx: MedVistaContext,
  boards: MedVistaBoards,
): Promise<void> {
  console.log(`[MedVista] Seeding ${PATIENTS.length} patients...`);

  const { patientBoard } = boards;

  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const groupId = getPatientGroup(p.status, patientBoard.groups);

    const item = await Item.create({
      boardId: patientBoard.boardId,
      groupId,
      name: p.name,
      position: i,
      createdBy: ctx.adminId,
    });

    const values = [
      { itemId: item.id, columnId: patientBoard.columns['Patient Name'], value: p.name },
      { itemId: item.id, columnId: patientBoard.columns['Specialty'], value: SPECIALTY_IDS[p.specialty] },
      { itemId: item.id, columnId: patientBoard.columns['Status'], value: { label: p.status, color: STATUS_COLORS[p.status] } },
      { itemId: item.id, columnId: patientBoard.columns['Insurance Verified'], value: p.insuranceVerified },
      { itemId: item.id, columnId: patientBoard.columns['First Appointment'], value: p.firstAppointment },
      { itemId: item.id, columnId: patientBoard.columns['Phone'], value: p.phone },
      { itemId: item.id, columnId: patientBoard.columns['Email'], value: p.email },
      { itemId: item.id, columnId: patientBoard.columns['Date of Birth'], value: p.dob },
      { itemId: item.id, columnId: patientBoard.columns['Insurance Provider'], value: INSURANCE_IDS[p.insuranceProvider] },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[MedVista] Seeded ${PATIENTS.length} patients across ${Object.keys(patientBoard.groups).length} groups`);
}

async function seedAppointments(
  ctx: MedVistaContext,
  boards: MedVistaBoards,
): Promise<void> {
  console.log(`[MedVista] Seeding ${APPOINTMENTS.length} appointments...`);

  const { appointmentBoard } = boards;
  const ROOM_IDS: Record<string, string> = {
    'Room 101': 'room_101',
    'Room 102': 'room_102',
    'Room 103': 'room_103',
    'Room 104': 'room_104',
    'Room 105': 'room_105',
    'Room 106': 'room_106',
    'Room 107': 'room_107',
    'Room 108': 'room_108',
  };

  for (let i = 0; i < APPOINTMENTS.length; i++) {
    const a = APPOINTMENTS[i];
    const groupId = getAppointmentGroup(a.status, appointmentBoard.groups);

    const item = await Item.create({
      boardId: appointmentBoard.boardId,
      groupId,
      name: `${a.patientName} — ${a.chiefComplaint}`,
      position: i,
      createdBy: ctx.adminId,
    });

    const providerId = ctx.providerIds[a.providerIndex];

    const values = [
      { itemId: item.id, columnId: appointmentBoard.columns['Patient Name'], value: a.patientName },
      { itemId: item.id, columnId: appointmentBoard.columns['Provider'], value: providerId },
      { itemId: item.id, columnId: appointmentBoard.columns['Date/Time'], value: a.dateTime },
      { itemId: item.id, columnId: appointmentBoard.columns['Status'], value: { label: a.status, color: APPOINTMENT_STATUS_COLORS[a.status] } },
      { itemId: item.id, columnId: appointmentBoard.columns['Chief Complaint'], value: a.chiefComplaint },
      { itemId: item.id, columnId: appointmentBoard.columns['Specialty'], value: SPECIALTY_IDS[a.specialty] },
      { itemId: item.id, columnId: appointmentBoard.columns['Room'], value: ROOM_IDS[a.room] },
      { itemId: item.id, columnId: appointmentBoard.columns['Duration'], value: a.duration },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[MedVista] Seeded ${APPOINTMENTS.length} appointments across ${Object.keys(appointmentBoard.groups).length} groups`);
}

async function seedClaims(
  ctx: MedVistaContext,
  boards: MedVistaBoards,
): Promise<void> {
  console.log(`[MedVista] Seeding ${CLAIMS.length} insurance claims...`);

  const { claimsBoard } = boards;

  for (let i = 0; i < CLAIMS.length; i++) {
    const c = CLAIMS[i];
    const groupId = getClaimGroup(c.status, claimsBoard.groups);

    const item = await Item.create({
      boardId: claimsBoard.boardId,
      groupId,
      name: `${c.claimNumber} — ${c.patientName}`,
      position: i,
      createdBy: ctx.billingId,
    });

    const values: Array<{ itemId: number; columnId: number; value: unknown }> = [
      { itemId: item.id, columnId: claimsBoard.columns['Claim Number'], value: c.claimNumber },
      { itemId: item.id, columnId: claimsBoard.columns['Patient'], value: c.patientName },
      { itemId: item.id, columnId: claimsBoard.columns['Status'], value: { label: c.status, color: CLAIM_STATUS_COLORS[c.status] } },
      { itemId: item.id, columnId: claimsBoard.columns['Amount'], value: c.amount },
      { itemId: item.id, columnId: claimsBoard.columns['Submitted Date'], value: c.submittedDate },
      { itemId: item.id, columnId: claimsBoard.columns['Insurance Provider'], value: INSURANCE_IDS[c.insuranceProvider] },
      { itemId: item.id, columnId: claimsBoard.columns['CPT Code'], value: c.cptCode },
      { itemId: item.id, columnId: claimsBoard.columns['Diagnosis'], value: c.diagnosis },
    ];

    if (c.paymentDate) {
      values.push({ itemId: item.id, columnId: claimsBoard.columns['Payment Date'], value: c.paymentDate });
    }

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[MedVista] Seeded ${CLAIMS.length} insurance claims across ${Object.keys(claimsBoard.groups).length} groups`);
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function seedMedVistaData(
  ctx: MedVistaContext,
  boards: MedVistaBoards,
): Promise<void> {
  await seedPatients(ctx, boards);
  await seedAppointments(ctx, boards);
  await seedClaims(ctx, boards);
}
