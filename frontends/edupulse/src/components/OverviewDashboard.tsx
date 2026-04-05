import { Users, BookOpen, ClipboardCheck, TrendingUp, GraduationCap, AlertTriangle } from 'lucide-react';
import type { Board, Item, ColumnValue } from '../types';

interface OverviewDashboardProps {
  boards: Board[];
  allItems: Record<number, Item[]>;
}

function countByStatus(items: Item[], statusColumnId: number | undefined, label: string): number {
  if (!statusColumnId) return 0;
  return items.filter((item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === statusColumnId);
    const val = cv?.value as { label: string } | null;
    return val?.label === label;
  }).length;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function OverviewDashboard({ boards, allItems }: OverviewDashboardProps) {
  const enrollmentBoard = boards.find((b) => b.name === 'Student Enrollment');
  const courseBoard = boards.find((b) => b.name === 'Course Management');
  const assignmentBoard = boards.find((b) => b.name === 'Assignment Tracker');

  const enrollmentItems = enrollmentBoard ? allItems[enrollmentBoard.id] || [] : [];
  const courseItems = courseBoard ? allItems[courseBoard.id] || [] : [];
  const assignmentItems = assignmentBoard ? allItems[assignmentBoard.id] || [] : [];

  const enrollmentStatusCol = enrollmentBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const courseStatusCol = courseBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const assignmentStatusCol = assignmentBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activeStudents = countByStatus(enrollmentItems, enrollmentStatusCol, 'Enrolled') +
    countByStatus(enrollmentItems, enrollmentStatusCol, 'Active');
  const activeCourses = countByStatus(courseItems, courseStatusCol, 'Active') +
    countByStatus(courseItems, courseStatusCol, 'In Progress');
  const pendingAssignments = countByStatus(assignmentItems, assignmentStatusCol, 'Pending') +
    countByStatus(assignmentItems, assignmentStatusCol, 'In Progress');
  const newApplications = countByStatus(enrollmentItems, enrollmentStatusCol, 'Applied') +
    countByStatus(enrollmentItems, enrollmentStatusCol, 'New');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">EduPulse Academy — Empowering Minds, Shaping Futures</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={activeStudents} color="#6D28D9" />
        <StatCard icon={BookOpen} label="Active Courses" value={activeCourses} color="#5B21B6" />
        <StatCard icon={ClipboardCheck} label="Pending Assignments" value={pendingAssignments} color="#7C3AED" />
        <StatCard icon={GraduationCap} label="New Applications" value={newApplications} color="#818CF8" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student Enrollment Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold">Student Enrollment</h3>
          </div>
          <div className="space-y-3">
            {['Applied', 'Accepted', 'Enrolled', 'Active', 'Graduated', 'Withdrawn'].map((status) => {
              const count = countByStatus(enrollmentItems, enrollmentStatusCol, status);
              const total = enrollmentItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Applied: '#579BFC', Accepted: '#FDAB3D', Enrolled: '#00C875',
                Active: '#9B59B6', Graduated: '#C4C4C4', Withdrawn: '#E2445C',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Management Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-brand-600" />
            <h3 className="font-semibold">Course Management</h3>
          </div>
          <div className="space-y-3">
            {['Active', 'In Progress', 'Upcoming', 'Completed'].map((status) => {
              const count = countByStatus(courseItems, courseStatusCol, status);
              const total = courseItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Active: '#00C875', 'In Progress': '#FDAB3D', Upcoming: '#579BFC', Completed: '#C4C4C4',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignment Tracker Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck size={18} className="text-brand-600" />
            <h3 className="font-semibold">Assignment Tracker</h3>
          </div>
          <div className="space-y-3">
            {['Pending', 'In Progress', 'Submitted', 'Graded', 'Overdue'].map((status) => {
              const count = countByStatus(assignmentItems, assignmentStatusCol, status);
              const total = assignmentItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Pending: '#579BFC', 'In Progress': '#FDAB3D', Submitted: '#00C875',
                Graded: '#C4C4C4', Overdue: '#E2445C',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-semibold">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-600">{enrollmentItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Students</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-violet-700">{courseItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Courses</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-700">{assignmentItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Assignments</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-500">15</p>
            <p className="text-xs text-gray-500 mt-1">Instructors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
