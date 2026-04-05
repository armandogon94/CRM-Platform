import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { EduPulseContext } from './workspace';
import { EduPulseBoards } from './boards';

// ─── 30 Course Records ─────────────────────────────────────────────────────
// Across departments and grade levels
// ~12 Active, ~8 Upcoming, ~7 Completed, ~3 Cancelled

interface CourseRecord {
  name: string;
  teacherIndex: number;   // 0-5 into teacherIds array
  gradeLevel: string;     // elementary | middle | high | college
  capacity: number;
  enrolled: number;
  startDate: string;
  endDate: string;
  department: string;     // math | science | english | history | art | pe | cs
  status: string;
  group: 'active' | 'upcoming' | 'completed' | 'cancelled';
}

const COURSES: CourseRecord[] = [
  // ─── Active (12) ─────────────────────────────────────────────
  { name: 'Algebra I', teacherIndex: 0, gradeLevel: 'high', capacity: 30, enrolled: 28, startDate: '2026-01-12', endDate: '2026-05-22', department: 'math', status: 'active', group: 'active' },
  { name: 'Biology 101', teacherIndex: 1, gradeLevel: 'high', capacity: 28, enrolled: 26, startDate: '2026-01-12', endDate: '2026-05-22', department: 'science', status: 'active', group: 'active' },
  { name: 'English Literature', teacherIndex: 2, gradeLevel: 'high', capacity: 32, enrolled: 30, startDate: '2026-01-12', endDate: '2026-05-22', department: 'english', status: 'active', group: 'active' },
  { name: 'World History', teacherIndex: 3, gradeLevel: 'high', capacity: 30, enrolled: 27, startDate: '2026-01-12', endDate: '2026-05-22', department: 'history', status: 'active', group: 'active' },
  { name: 'Introduction to Programming', teacherIndex: 4, gradeLevel: 'high', capacity: 25, enrolled: 24, startDate: '2026-01-12', endDate: '2026-05-22', department: 'cs', status: 'active', group: 'active' },
  { name: '6th Grade Math', teacherIndex: 0, gradeLevel: 'middle', capacity: 28, enrolled: 25, startDate: '2026-01-12', endDate: '2026-05-22', department: 'math', status: 'active', group: 'active' },
  { name: 'Earth Science', teacherIndex: 1, gradeLevel: 'middle', capacity: 26, enrolled: 22, startDate: '2026-01-12', endDate: '2026-05-22', department: 'science', status: 'active', group: 'active' },
  { name: 'Creative Writing', teacherIndex: 2, gradeLevel: 'middle', capacity: 24, enrolled: 20, startDate: '2026-01-12', endDate: '2026-05-22', department: 'english', status: 'active', group: 'active' },
  { name: 'Studio Art', teacherIndex: 5, gradeLevel: 'high', capacity: 20, enrolled: 18, startDate: '2026-01-12', endDate: '2026-05-22', department: 'art', status: 'active', group: 'active' },
  { name: 'Physical Education', teacherIndex: 3, gradeLevel: 'middle', capacity: 35, enrolled: 32, startDate: '2026-01-12', endDate: '2026-05-22', department: 'pe', status: 'active', group: 'active' },
  { name: 'Calculus AB', teacherIndex: 0, gradeLevel: 'college', capacity: 30, enrolled: 22, startDate: '2026-01-12', endDate: '2026-05-22', department: 'math', status: 'active', group: 'active' },
  { name: 'Data Structures', teacherIndex: 4, gradeLevel: 'college', capacity: 25, enrolled: 23, startDate: '2026-01-12', endDate: '2026-05-22', department: 'cs', status: 'active', group: 'active' },

  // ─── Upcoming (8) ────────────────────────────────────────────
  { name: 'Geometry', teacherIndex: 0, gradeLevel: 'high', capacity: 30, enrolled: 15, startDate: '2026-08-25', endDate: '2026-12-18', department: 'math', status: 'upcoming', group: 'upcoming' },
  { name: 'Chemistry', teacherIndex: 1, gradeLevel: 'high', capacity: 28, enrolled: 12, startDate: '2026-08-25', endDate: '2026-12-18', department: 'science', status: 'upcoming', group: 'upcoming' },
  { name: 'American Literature', teacherIndex: 2, gradeLevel: 'high', capacity: 32, enrolled: 18, startDate: '2026-08-25', endDate: '2026-12-18', department: 'english', status: 'upcoming', group: 'upcoming' },
  { name: 'US Government', teacherIndex: 3, gradeLevel: 'high', capacity: 30, enrolled: 10, startDate: '2026-08-25', endDate: '2026-12-18', department: 'history', status: 'upcoming', group: 'upcoming' },
  { name: 'Web Development', teacherIndex: 4, gradeLevel: 'college', capacity: 25, enrolled: 8, startDate: '2026-08-25', endDate: '2026-12-18', department: 'cs', status: 'upcoming', group: 'upcoming' },
  { name: 'Watercolor Painting', teacherIndex: 5, gradeLevel: 'middle', capacity: 20, enrolled: 6, startDate: '2026-08-25', endDate: '2026-12-18', department: 'art', status: 'upcoming', group: 'upcoming' },
  { name: 'Elementary Reading', teacherIndex: 2, gradeLevel: 'elementary', capacity: 22, enrolled: 14, startDate: '2026-08-25', endDate: '2026-12-18', department: 'english', status: 'upcoming', group: 'upcoming' },
  { name: 'Team Sports', teacherIndex: 3, gradeLevel: 'high', capacity: 35, enrolled: 20, startDate: '2026-08-25', endDate: '2026-12-18', department: 'pe', status: 'upcoming', group: 'upcoming' },

  // ─── Completed (7) ───────────────────────────────────────────
  { name: 'Pre-Algebra', teacherIndex: 0, gradeLevel: 'middle', capacity: 28, enrolled: 28, startDate: '2025-08-25', endDate: '2025-12-19', department: 'math', status: 'completed', group: 'completed' },
  { name: 'Life Science', teacherIndex: 1, gradeLevel: 'middle', capacity: 26, enrolled: 24, startDate: '2025-08-25', endDate: '2025-12-19', department: 'science', status: 'completed', group: 'completed' },
  { name: 'English Composition', teacherIndex: 2, gradeLevel: 'high', capacity: 30, enrolled: 29, startDate: '2025-08-25', endDate: '2025-12-19', department: 'english', status: 'completed', group: 'completed' },
  { name: 'Ancient Civilizations', teacherIndex: 3, gradeLevel: 'middle', capacity: 28, enrolled: 25, startDate: '2025-08-25', endDate: '2025-12-19', department: 'history', status: 'completed', group: 'completed' },
  { name: 'Digital Art', teacherIndex: 5, gradeLevel: 'high', capacity: 20, enrolled: 19, startDate: '2025-08-25', endDate: '2025-12-19', department: 'art', status: 'completed', group: 'completed' },
  { name: 'Computer Science Principles', teacherIndex: 4, gradeLevel: 'high', capacity: 25, enrolled: 25, startDate: '2025-08-25', endDate: '2025-12-19', department: 'cs', status: 'completed', group: 'completed' },
  { name: 'Fitness & Wellness', teacherIndex: 3, gradeLevel: 'middle', capacity: 35, enrolled: 33, startDate: '2025-08-25', endDate: '2025-12-19', department: 'pe', status: 'completed', group: 'completed' },

  // ─── Cancelled (3) ───────────────────────────────────────────
  { name: 'Advanced Robotics', teacherIndex: 4, gradeLevel: 'high', capacity: 20, enrolled: 4, startDate: '2026-01-12', endDate: '2026-05-22', department: 'cs', status: 'cancelled', group: 'cancelled' },
  { name: 'Latin', teacherIndex: 2, gradeLevel: 'high', capacity: 25, enrolled: 3, startDate: '2026-01-12', endDate: '2026-05-22', department: 'english', status: 'cancelled', group: 'cancelled' },
  { name: 'Film Studies', teacherIndex: 5, gradeLevel: 'college', capacity: 20, enrolled: 5, startDate: '2026-01-12', endDate: '2026-05-22', department: 'art', status: 'cancelled', group: 'cancelled' },
];

export async function seedCourses(ctx: EduPulseContext, boards: EduPulseBoards): Promise<void> {
  console.log('[EduPulse] Seeding 30 course records...');

  const groupMap: Record<string, number> = {
    active: boards.courseActiveGroupId,
    upcoming: boards.courseUpcomingGroupId,
    completed: boards.courseCompletedGroupId,
    cancelled: boards.courseCancelledGroupId,
  };

  for (let i = 0; i < COURSES.length; i++) {
    const c = COURSES[i];
    const teacherId = ctx.teacherIds[c.teacherIndex];

    const item = await Item.create({
      boardId: boards.courseManagementId,
      groupId: groupMap[c.group],
      name: c.name,
      position: i,
      createdBy: ctx.deanId,
    });

    await ColumnValue.bulkCreate([
      { itemId: item.id, columnId: boards.courseStatusColId, value: { labelId: c.status } },
      { itemId: item.id, columnId: boards.courseTeacherColId, value: { userId: teacherId, displayName: '' } },
      { itemId: item.id, columnId: boards.courseGradeLevelColId, value: { selectedId: c.gradeLevel } },
      { itemId: item.id, columnId: boards.enrollmentCapacityColId, value: { number: c.capacity } },
      { itemId: item.id, columnId: boards.currentEnrollmentColId, value: { number: c.enrolled } },
      { itemId: item.id, columnId: boards.courseStartDateColId, value: { date: c.startDate } },
      { itemId: item.id, columnId: boards.courseEndDateColId, value: { date: c.endDate } },
      { itemId: item.id, columnId: boards.departmentColId, value: { selectedId: c.department } },
    ]);
  }

  console.log(`[EduPulse] Seeded ${COURSES.length} courses`);
}
