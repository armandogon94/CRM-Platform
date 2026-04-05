import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { EduPulseContext } from './workspace';
import { EduPulseBoards } from './boards';

// ─── 60 Assignment Records ─────────────────────────────────────────────────
// Across courses and statuses
// ~12 Assigned, ~15 In Progress, ~15 Submitted, ~18 Graded

interface AssignmentRecord {
  name: string;
  course: string;
  dueDate: string;
  submissions: number;
  gradedCount: number;
  averageScore: number | null;
  status: string;
  group: 'assigned' | 'in_progress' | 'submitted' | 'graded';
}

const ASSIGNMENTS: AssignmentRecord[] = [
  // ─── Assigned (12) ───────────────────────────────────────────
  { name: 'Linear Equations Problem Set', course: 'Algebra I', dueDate: '2026-04-14', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Cell Division Lab Report', course: 'Biology 101', dueDate: '2026-04-15', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Shakespeare Essay — Hamlet Act III', course: 'English Literature', dueDate: '2026-04-16', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'WWI Timeline Project', course: 'World History', dueDate: '2026-04-18', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Python Functions Exercise', course: 'Introduction to Programming', dueDate: '2026-04-11', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Fraction Word Problems', course: '6th Grade Math', dueDate: '2026-04-10', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Rock Cycle Poster', course: 'Earth Science', dueDate: '2026-04-17', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Personal Narrative Draft', course: 'Creative Writing', dueDate: '2026-04-13', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Self-Portrait in Charcoal', course: 'Studio Art', dueDate: '2026-04-19', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Fitness Log Week 12', course: 'Physical Education', dueDate: '2026-04-10', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Integration Techniques Quiz', course: 'Calculus AB', dueDate: '2026-04-12', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },
  { name: 'Binary Search Tree Implementation', course: 'Data Structures', dueDate: '2026-04-16', submissions: 0, gradedCount: 0, averageScore: null, status: 'assigned', group: 'assigned' },

  // ─── In Progress (15) ────────────────────────────────────────
  { name: 'Quadratic Equations Worksheet', course: 'Algebra I', dueDate: '2026-04-09', submissions: 12, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Photosynthesis Experiment', course: 'Biology 101', dueDate: '2026-04-08', submissions: 10, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Poetry Analysis — Robert Frost', course: 'English Literature', dueDate: '2026-04-09', submissions: 15, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Renaissance Research Paper', course: 'World History', dueDate: '2026-04-10', submissions: 8, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'HTML/CSS Landing Page', course: 'Introduction to Programming', dueDate: '2026-04-07', submissions: 14, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Decimal Operations Homework', course: '6th Grade Math', dueDate: '2026-04-06', submissions: 18, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Weather Data Collection', course: 'Earth Science', dueDate: '2026-04-08', submissions: 9, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Dialogue Workshop', course: 'Creative Writing', dueDate: '2026-04-07', submissions: 11, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Landscape Watercolor', course: 'Studio Art', dueDate: '2026-04-09', submissions: 7, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Endurance Run Assessment', course: 'Physical Education', dueDate: '2026-04-06', submissions: 20, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Limits & Continuity Problem Set', course: 'Calculus AB', dueDate: '2026-04-07', submissions: 10, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Linked List Operations Lab', course: 'Data Structures', dueDate: '2026-04-08', submissions: 13, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Proportions & Ratios Quiz', course: '6th Grade Math', dueDate: '2026-04-10', submissions: 16, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Mineral Identification Lab', course: 'Earth Science', dueDate: '2026-04-09', submissions: 6, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },
  { name: 'Short Story First Draft', course: 'Creative Writing', dueDate: '2026-04-11', submissions: 5, gradedCount: 0, averageScore: null, status: 'in_progress', group: 'in_progress' },

  // ─── Submitted (15) ──────────────────────────────────────────
  { name: 'Systems of Equations Test', course: 'Algebra I', dueDate: '2026-04-02', submissions: 28, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Genetics Punnett Square Quiz', course: 'Biology 101', dueDate: '2026-04-01', submissions: 25, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'The Great Gatsby Book Report', course: 'English Literature', dueDate: '2026-04-02', submissions: 29, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Cold War Essay', course: 'World History', dueDate: '2026-04-01', submissions: 26, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'JavaScript Calculator Project', course: 'Introduction to Programming', dueDate: '2026-03-31', submissions: 23, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Area & Perimeter Test', course: '6th Grade Math', dueDate: '2026-03-30', submissions: 24, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Volcano Model Project', course: 'Earth Science', dueDate: '2026-04-01', submissions: 21, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Persuasive Essay', course: 'Creative Writing', dueDate: '2026-03-31', submissions: 19, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Mixed Media Collage', course: 'Studio Art', dueDate: '2026-04-02', submissions: 17, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Volleyball Skills Test', course: 'Physical Education', dueDate: '2026-03-30', submissions: 31, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Derivatives Chapter Test', course: 'Calculus AB', dueDate: '2026-03-31', submissions: 21, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Stack & Queue Implementation', course: 'Data Structures', dueDate: '2026-04-01', submissions: 22, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Integer Operations Quiz', course: '6th Grade Math', dueDate: '2026-03-28', submissions: 25, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Plate Tectonics Essay', course: 'Earth Science', dueDate: '2026-03-29', submissions: 20, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },
  { name: 'Memoir Workshop Piece', course: 'Creative Writing', dueDate: '2026-03-30', submissions: 18, gradedCount: 0, averageScore: null, status: 'submitted', group: 'submitted' },

  // ─── Graded (18) ─────────────────────────────────────────────
  { name: 'Polynomials Unit Test', course: 'Algebra I', dueDate: '2026-03-20', submissions: 28, gradedCount: 28, averageScore: 82.5, status: 'graded', group: 'graded' },
  { name: 'Ecosystem Diorama', course: 'Biology 101', dueDate: '2026-03-18', submissions: 26, gradedCount: 26, averageScore: 88.3, status: 'graded', group: 'graded' },
  { name: 'Romeo & Juliet Analysis', course: 'English Literature', dueDate: '2026-03-19', submissions: 30, gradedCount: 30, averageScore: 79.8, status: 'graded', group: 'graded' },
  { name: 'Ancient Rome Presentation', course: 'World History', dueDate: '2026-03-17', submissions: 27, gradedCount: 27, averageScore: 85.2, status: 'graded', group: 'graded' },
  { name: 'Variables & Loops Quiz', course: 'Introduction to Programming', dueDate: '2026-03-16', submissions: 24, gradedCount: 24, averageScore: 91.4, status: 'graded', group: 'graded' },
  { name: 'Multiplication Facts Drill', course: '6th Grade Math', dueDate: '2026-03-15', submissions: 25, gradedCount: 25, averageScore: 76.9, status: 'graded', group: 'graded' },
  { name: 'Solar System Model', course: 'Earth Science', dueDate: '2026-03-18', submissions: 22, gradedCount: 22, averageScore: 87.1, status: 'graded', group: 'graded' },
  { name: 'Haiku Collection', course: 'Creative Writing', dueDate: '2026-03-14', submissions: 20, gradedCount: 20, averageScore: 83.6, status: 'graded', group: 'graded' },
  { name: 'Still Life Drawing', course: 'Studio Art', dueDate: '2026-03-17', submissions: 18, gradedCount: 18, averageScore: 90.2, status: 'graded', group: 'graded' },
  { name: 'Basketball Skills Assessment', course: 'Physical Education', dueDate: '2026-03-13', submissions: 32, gradedCount: 32, averageScore: 84.7, status: 'graded', group: 'graded' },
  { name: 'Differentiation Rules Exam', course: 'Calculus AB', dueDate: '2026-03-15', submissions: 22, gradedCount: 22, averageScore: 74.3, status: 'graded', group: 'graded' },
  { name: 'Array Algorithms Lab', course: 'Data Structures', dueDate: '2026-03-16', submissions: 23, gradedCount: 23, averageScore: 86.8, status: 'graded', group: 'graded' },
  { name: 'Order of Operations Test', course: '6th Grade Math', dueDate: '2026-03-10', submissions: 25, gradedCount: 25, averageScore: 78.4, status: 'graded', group: 'graded' },
  { name: 'Water Cycle Diagram', course: 'Earth Science', dueDate: '2026-03-12', submissions: 22, gradedCount: 22, averageScore: 92.1, status: 'graded', group: 'graded' },
  { name: 'Descriptive Writing Exercise', course: 'Creative Writing', dueDate: '2026-03-11', submissions: 20, gradedCount: 20, averageScore: 81.5, status: 'graded', group: 'graded' },
  { name: 'Slope-Intercept Homework', course: 'Algebra I', dueDate: '2026-03-08', submissions: 28, gradedCount: 28, averageScore: 77.2, status: 'graded', group: 'graded' },
  { name: 'Microscope Lab Report', course: 'Biology 101', dueDate: '2026-03-09', submissions: 26, gradedCount: 26, averageScore: 85.9, status: 'graded', group: 'graded' },
  { name: 'Greek Mythology Research', course: 'World History', dueDate: '2026-03-07', submissions: 27, gradedCount: 27, averageScore: 88.7, status: 'graded', group: 'graded' },
];

export async function seedAssignments(ctx: EduPulseContext, boards: EduPulseBoards): Promise<void> {
  console.log('[EduPulse] Seeding 60 assignment records...');

  const groupMap: Record<string, number> = {
    assigned: boards.assignmentAssignedGroupId,
    in_progress: boards.assignmentInProgressGroupId,
    submitted: boards.assignmentSubmittedGroupId,
    graded: boards.assignmentGradedGroupId,
  };

  for (let i = 0; i < ASSIGNMENTS.length; i++) {
    const a = ASSIGNMENTS[i];

    const item = await Item.create({
      boardId: boards.assignmentTrackerId,
      groupId: groupMap[a.group],
      name: a.name,
      position: i,
      createdBy: ctx.deanId,
    });

    const columnValues: Array<{ itemId: number; columnId: number; value: Record<string, unknown> }> = [
      { itemId: item.id, columnId: boards.assignmentStatusColId, value: { labelId: a.status } },
      { itemId: item.id, columnId: boards.assignmentCourseColId, value: { text: a.course } },
      { itemId: item.id, columnId: boards.dueDateColId, value: { date: a.dueDate } },
      { itemId: item.id, columnId: boards.submissionsColId, value: { number: a.submissions } },
      { itemId: item.id, columnId: boards.gradedCountColId, value: { number: a.gradedCount } },
    ];

    if (a.averageScore !== null) {
      columnValues.push({ itemId: item.id, columnId: boards.averageScoreColId, value: { number: a.averageScore } });
    }

    await ColumnValue.bulkCreate(columnValues);
  }

  console.log(`[EduPulse] Seeded ${ASSIGNMENTS.length} assignments`);
}
