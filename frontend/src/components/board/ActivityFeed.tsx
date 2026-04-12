import { useState, useEffect } from 'react';
import { Clock, FileText, Columns, Users, Layers } from 'lucide-react';
import api from '@/utils/api';

interface ActivityEntry {
  id: number;
  userId: number;
  entityType: string;
  entityId: number;
  action: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivityFeedProps {
  boardId: number;
}

const ENTITY_ICONS: Record<string, typeof FileText> = {
  item: FileText,
  column: Columns,
  column_value: Columns,
  group: Layers,
  user: Users,
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

function describeAction(entry: ActivityEntry): string {
  const { entityType, action, changes } = entry;
  const type = entityType.replace('_', ' ');

  if (action === 'created') return `created ${type} #${entry.entityId}`;
  if (action === 'updated') {
    if (changes && typeof changes === 'object') {
      const fields = Object.keys(changes);
      if (fields.length > 0) {
        return `updated ${fields.join(', ')} on ${type} #${entry.entityId}`;
      }
    }
    return `updated ${type} #${entry.entityId}`;
  }
  if (action === 'deleted') return `deleted ${type} #${entry.entityId}`;
  if (action === 'changed') return `changed ${type} #${entry.entityId}`;
  return `${action} ${type} #${entry.entityId}`;
}

export function ActivityFeed({ boardId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await api.get(`/activity/board/${boardId}?page=1&limit=20`);
        if (!cancelled && res.success) {
          setActivities(res.data.activities);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchActivities();
    return () => { cancelled = true; };
  }, [boardId]);

  if (loading) {
    return (
      <div data-testid="activity-loading" className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div data-testid="activity-empty" className="text-center py-8 text-gray-400">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div data-testid="activity-feed" className="space-y-0">
      {activities.map((entry) => {
        const Icon = ENTITY_ICONS[entry.entityType] || FileText;
        return (
          <div
            key={entry.id}
            data-testid={`activity-entry-${entry.id}`}
            className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <div className="mt-0.5 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">
                <span className="font-medium">User #{entry.userId}</span>{' '}
                {describeAction(entry)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatRelativeTime(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
