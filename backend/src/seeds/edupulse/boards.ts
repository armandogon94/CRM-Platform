import Board from '../../models/Board';
import BoardGroup from '../../models/BoardGroup';
import Column from '../../models/Column';
import BoardView from '../../models/BoardView';
import { EduPulseContext } from './workspace';

export interface EduPulseBoards {
  studentEnrollmentId: number;
  courseManagementId: number;
  assignmentTrackerId: number;
  // Column IDs — Student Enrollment
  studentStatusColId: number;
  gradeLevelColId: number;
  applicationDateColId: number;
  enrollmentDateColId: number;
  gpaColId: number;
  parentContactColId: number;
  // Column IDs — Course Management
  courseStatusColId: number;
  courseTeacherColId: number;
  courseGradeLevelColId: number;
  enrollmentCapacityColId: number;
  currentEnrollmentColId: number;
  courseStartDateColId: number;
  courseEndDateColId: number;
  departmentColId: number;
  // Column IDs — Assignment Tracker
  assignmentStatusColId: number;
  assignmentCourseColId: number;
  dueDateColId: number;
  submissionsColId: number;
  gradedCountColId: number;
  averageScoreColId: number;
  // Group IDs — Student Enrollment
  studentInquiryGroupId: number;
  studentApplicationGroupId: number;
  studentAcceptedGroupId: number;
  studentEnrolledGroupId: number;
  studentGraduatedGroupId: number;
  studentWithdrawnGroupId: number;
  // Group IDs — Course Management
  courseActiveGroupId: number;
  courseUpcomingGroupId: number;
  courseCompletedGroupId: number;
  courseCancelledGroupId: number;
  // Group IDs — Assignment Tracker
  assignmentAssignedGroupId: number;
  assignmentInProgressGroupId: number;
  assignmentSubmittedGroupId: number;
  assignmentGradedGroupId: number;
}

export async function seedEduPulseBoards(ctx: EduPulseContext): Promise<EduPulseBoards> {
  console.log('[EduPulse] Creating board templates...');

  // ─── Board 1: Student Enrollment ──────────────────────────────────────────
  const enrollmentBoard = await Board.create({
    name: 'Student Enrollment',
    description: 'Track students from inquiry through graduation or withdrawal',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'graduation-cap',
      color: '#6D28D9',
      category: 'education',
      defaultView: 'table',
    },
  });

  // Student Enrollment groups
  const studentInquiryGroup = await BoardGroup.create({ boardId: enrollmentBoard.id, name: 'Inquiry', color: '#579BFC', position: 0 });
  const studentApplicationGroup = await BoardGroup.create({ boardId: enrollmentBoard.id, name: 'Application', color: '#FDAB3D', position: 1 });
  const studentAcceptedGroup = await BoardGroup.create({ boardId: enrollmentBoard.id, name: 'Accepted', color: '#00C875', position: 2 });
  const studentEnrolledGroup = await BoardGroup.create({ boardId: enrollmentBoard.id, name: 'Enrolled', color: '#9B59B6', position: 3 });
  const studentGraduatedGroup = await BoardGroup.create({ boardId: enrollmentBoard.id, name: 'Graduated', color: '#037F4C', position: 4 });
  const studentWithdrawnGroup = await BoardGroup.create({ boardId: enrollmentBoard.id, name: 'Withdrawn', color: '#E2445C', position: 5 });

  // Student Enrollment columns
  const studentStatusCol = await Column.create({
    boardId: enrollmentBoard.id, name: 'Status', columnType: 'status', position: 0, width: 140,
    config: {
      labels: [
        { id: 'inquiry', text: 'Inquiry', color: '#579BFC' },
        { id: 'application', text: 'Application', color: '#FDAB3D' },
        { id: 'accepted', text: 'Accepted', color: '#00C875' },
        { id: 'enrolled', text: 'Enrolled', color: '#9B59B6' },
        { id: 'graduated', text: 'Graduated', color: '#037F4C' },
        { id: 'withdrawn', text: 'Withdrawn', color: '#E2445C' },
      ],
    },
  });
  const gradeLevelCol = await Column.create({
    boardId: enrollmentBoard.id, name: 'Grade Level', columnType: 'dropdown', position: 1, width: 140,
    config: {
      options: [
        { id: 'k', text: 'Kindergarten', color: '#FF642E' },
        { id: '1', text: '1st Grade', color: '#FDAB3D' },
        { id: '2', text: '2nd Grade', color: '#FFD533' },
        { id: '3', text: '3rd Grade', color: '#CAB641' },
        { id: '4', text: '4th Grade', color: '#00C875' },
        { id: '5', text: '5th Grade', color: '#9CD326' },
        { id: '6', text: '6th Grade', color: '#579BFC' },
        { id: '7', text: '7th Grade', color: '#66CCFF' },
        { id: '8', text: '8th Grade', color: '#A25DDC' },
        { id: '9', text: '9th Grade', color: '#9B59B6' },
        { id: '10', text: '10th Grade', color: '#7E3B8A' },
        { id: '11', text: '11th Grade', color: '#E2445C' },
        { id: '12', text: '12th Grade', color: '#BB3354' },
        { id: 'college', text: 'College', color: '#6D28D9' },
      ],
    },
  });
  const applicationDateCol = await Column.create({
    boardId: enrollmentBoard.id, name: 'Application Date', columnType: 'date', position: 2, width: 140,
  });
  const enrollmentDateCol = await Column.create({
    boardId: enrollmentBoard.id, name: 'Enrollment Date', columnType: 'date', position: 3, width: 140,
  });
  const gpaCol = await Column.create({
    boardId: enrollmentBoard.id, name: 'GPA', columnType: 'number', position: 4, width: 100,
    config: { format: 'decimal', decimals: 2, min: 0, max: 4 },
  });
  const parentContactCol = await Column.create({
    boardId: enrollmentBoard.id, name: 'Parent Contact', columnType: 'text', position: 5, width: 180,
    config: { placeholder: 'Parent/Guardian name & phone' },
  });

  await BoardView.create({
    boardId: enrollmentBoard.id, name: 'Main Table', viewType: 'table',
    isDefault: true, createdBy: ctx.adminId, settings: {},
  });
  await BoardView.create({
    boardId: enrollmentBoard.id, name: 'Kanban', viewType: 'kanban',
    isDefault: false, createdBy: ctx.adminId, settings: { groupByColumn: studentStatusCol.id },
  });

  // ─── Board 2: Course Management ───────────────────────────────────────────
  const courseBoard = await Board.create({
    name: 'Course Management',
    description: 'Manage course offerings, teacher assignments, and enrollment capacity',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'book-open',
      color: '#7C3AED',
      category: 'education',
      defaultView: 'table',
    },
  });

  // Course Management groups
  const courseActiveGroup = await BoardGroup.create({ boardId: courseBoard.id, name: 'Active', color: '#00C875', position: 0 });
  const courseUpcomingGroup = await BoardGroup.create({ boardId: courseBoard.id, name: 'Upcoming', color: '#579BFC', position: 1 });
  const courseCompletedGroup = await BoardGroup.create({ boardId: courseBoard.id, name: 'Completed', color: '#C4C4C4', position: 2 });
  const courseCancelledGroup = await BoardGroup.create({ boardId: courseBoard.id, name: 'Cancelled', color: '#E2445C', position: 3 });

  // Course Management columns
  const courseStatusCol = await Column.create({
    boardId: courseBoard.id, name: 'Status', columnType: 'status', position: 0, width: 130,
    config: {
      labels: [
        { id: 'active', text: 'Active', color: '#00C875' },
        { id: 'upcoming', text: 'Upcoming', color: '#579BFC' },
        { id: 'completed', text: 'Completed', color: '#C4C4C4' },
        { id: 'cancelled', text: 'Cancelled', color: '#E2445C' },
      ],
    },
  });
  const courseTeacherCol = await Column.create({
    boardId: courseBoard.id, name: 'Teacher', columnType: 'person', position: 1, width: 170,
  });
  const courseGradeLevelCol = await Column.create({
    boardId: courseBoard.id, name: 'Grade Level', columnType: 'dropdown', position: 2, width: 130,
    config: {
      options: [
        { id: 'elementary', text: 'Elementary (K-5)', color: '#FF642E' },
        { id: 'middle', text: 'Middle (6-8)', color: '#579BFC' },
        { id: 'high', text: 'High (9-12)', color: '#9B59B6' },
        { id: 'college', text: 'College', color: '#6D28D9' },
      ],
    },
  });
  const enrollmentCapacityCol = await Column.create({
    boardId: courseBoard.id, name: 'Enrollment Capacity', columnType: 'number', position: 3, width: 140,
    config: { format: 'integer' },
  });
  const currentEnrollmentCol = await Column.create({
    boardId: courseBoard.id, name: 'Current Enrollment', columnType: 'number', position: 4, width: 140,
    config: { format: 'integer' },
  });
  const courseStartDateCol = await Column.create({
    boardId: courseBoard.id, name: 'Start Date', columnType: 'date', position: 5, width: 130,
  });
  const courseEndDateCol = await Column.create({
    boardId: courseBoard.id, name: 'End Date', columnType: 'date', position: 6, width: 130,
  });
  const departmentCol = await Column.create({
    boardId: courseBoard.id, name: 'Department', columnType: 'dropdown', position: 7, width: 130,
    config: {
      options: [
        { id: 'math', text: 'Math', color: '#579BFC' },
        { id: 'science', text: 'Science', color: '#00C875' },
        { id: 'english', text: 'English', color: '#FDAB3D' },
        { id: 'history', text: 'History', color: '#9B59B6' },
        { id: 'art', text: 'Art', color: '#FF642E' },
        { id: 'pe', text: 'PE', color: '#E2445C' },
        { id: 'cs', text: 'CS', color: '#6D28D9' },
      ],
    },
  });

  await BoardView.create({
    boardId: courseBoard.id, name: 'Main Table', viewType: 'table',
    isDefault: true, createdBy: ctx.adminId, settings: {},
  });
  await BoardView.create({
    boardId: courseBoard.id, name: 'Calendar', viewType: 'calendar',
    isDefault: false, createdBy: ctx.adminId, settings: { dateColumn: courseStartDateCol.id },
  });

  // ─── Board 3: Assignment Tracker ──────────────────────────────────────────
  const assignmentBoard = await Board.create({
    name: 'Assignment Tracker',
    description: 'Track assignments from creation through grading across all courses',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    isTemplate: true,
    settings: {
      icon: 'clipboard-check',
      color: '#A78BFA',
      category: 'education',
      defaultView: 'table',
    },
  });

  // Assignment Tracker groups
  const assignmentAssignedGroup = await BoardGroup.create({ boardId: assignmentBoard.id, name: 'Assigned', color: '#579BFC', position: 0 });
  const assignmentInProgressGroup = await BoardGroup.create({ boardId: assignmentBoard.id, name: 'In Progress', color: '#FDAB3D', position: 1 });
  const assignmentSubmittedGroup = await BoardGroup.create({ boardId: assignmentBoard.id, name: 'Submitted', color: '#00C875', position: 2 });
  const assignmentGradedGroup = await BoardGroup.create({ boardId: assignmentBoard.id, name: 'Graded', color: '#C4C4C4', position: 3 });

  // Assignment Tracker columns
  const assignmentStatusCol = await Column.create({
    boardId: assignmentBoard.id, name: 'Status', columnType: 'status', position: 0, width: 130,
    config: {
      labels: [
        { id: 'assigned', text: 'Assigned', color: '#579BFC' },
        { id: 'in_progress', text: 'In Progress', color: '#FDAB3D' },
        { id: 'submitted', text: 'Submitted', color: '#00C875' },
        { id: 'graded', text: 'Graded', color: '#C4C4C4' },
      ],
    },
  });
  const assignmentCourseCol = await Column.create({
    boardId: assignmentBoard.id, name: 'Course', columnType: 'text', position: 1, width: 180,
    config: { placeholder: 'Course name' },
  });
  const dueDateCol = await Column.create({
    boardId: assignmentBoard.id, name: 'Due Date', columnType: 'date', position: 2, width: 130,
  });
  const submissionsCol = await Column.create({
    boardId: assignmentBoard.id, name: 'Submissions', columnType: 'number', position: 3, width: 120,
    config: { format: 'integer' },
  });
  const gradedCountCol = await Column.create({
    boardId: assignmentBoard.id, name: 'Graded Count', columnType: 'number', position: 4, width: 120,
    config: { format: 'integer' },
  });
  const averageScoreCol = await Column.create({
    boardId: assignmentBoard.id, name: 'Average Score', columnType: 'number', position: 5, width: 120,
    config: { format: 'decimal', decimals: 1, min: 0, max: 100 },
  });

  await BoardView.create({
    boardId: assignmentBoard.id, name: 'Main Table', viewType: 'table',
    isDefault: true, createdBy: ctx.adminId, settings: {},
  });
  await BoardView.create({
    boardId: assignmentBoard.id, name: 'Kanban', viewType: 'kanban',
    isDefault: false, createdBy: ctx.adminId, settings: { groupByColumn: assignmentStatusCol.id },
  });

  console.log('[EduPulse] Created 3 board templates with columns, groups, and views');

  return {
    studentEnrollmentId: enrollmentBoard.id,
    courseManagementId: courseBoard.id,
    assignmentTrackerId: assignmentBoard.id,
    // Student Enrollment columns
    studentStatusColId: studentStatusCol.id,
    gradeLevelColId: gradeLevelCol.id,
    applicationDateColId: applicationDateCol.id,
    enrollmentDateColId: enrollmentDateCol.id,
    gpaColId: gpaCol.id,
    parentContactColId: parentContactCol.id,
    // Course Management columns
    courseStatusColId: courseStatusCol.id,
    courseTeacherColId: courseTeacherCol.id,
    courseGradeLevelColId: courseGradeLevelCol.id,
    enrollmentCapacityColId: enrollmentCapacityCol.id,
    currentEnrollmentColId: currentEnrollmentCol.id,
    courseStartDateColId: courseStartDateCol.id,
    courseEndDateColId: courseEndDateCol.id,
    departmentColId: departmentCol.id,
    // Assignment Tracker columns
    assignmentStatusColId: assignmentStatusCol.id,
    assignmentCourseColId: assignmentCourseCol.id,
    dueDateColId: dueDateCol.id,
    submissionsColId: submissionsCol.id,
    gradedCountColId: gradedCountCol.id,
    averageScoreColId: averageScoreCol.id,
    // Student Enrollment groups
    studentInquiryGroupId: studentInquiryGroup.id,
    studentApplicationGroupId: studentApplicationGroup.id,
    studentAcceptedGroupId: studentAcceptedGroup.id,
    studentEnrolledGroupId: studentEnrolledGroup.id,
    studentGraduatedGroupId: studentGraduatedGroup.id,
    studentWithdrawnGroupId: studentWithdrawnGroup.id,
    // Course Management groups
    courseActiveGroupId: courseActiveGroup.id,
    courseUpcomingGroupId: courseUpcomingGroup.id,
    courseCompletedGroupId: courseCompletedGroup.id,
    courseCancelledGroupId: courseCancelledGroup.id,
    // Assignment Tracker groups
    assignmentAssignedGroupId: assignmentAssignedGroup.id,
    assignmentInProgressGroupId: assignmentInProgressGroup.id,
    assignmentSubmittedGroupId: assignmentSubmittedGroup.id,
    assignmentGradedGroupId: assignmentGradedGroup.id,
  };
}
