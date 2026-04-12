import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import api from '@/utils/api';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const TYPE_COLORS: Record<string, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { subscribe, unsubscribe } = useWebSocket();

  // Fetch unread count on mount
  useEffect(() => {
    api.get<{ count: number }>('/notifications/unread-count').then((res) => {
      if (res.success && res.data) {
        setUnreadCount(res.data.count);
      }
    });
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [notification, ...prev]);
    };

    subscribe('notification:created', handleNewNotification);
    return () => unsubscribe('notification:created', handleNewNotification);
  }, [subscribe, unsubscribe]);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      const opening = !prev;
      if (opening) {
        api
          .get<{ notifications: Notification[] }>('/notifications?limit=20')
          .then((res) => {
            if (res.success && res.data) {
              setNotifications(res.data.notifications);
            }
          });
      }
      return opening;
    });
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        data-testid="notification-bell"
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          data-testid="notification-panel"
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                data-testid="mark-all-read"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = TYPE_ICONS[notif.type] || Info;
                const colorClass = TYPE_COLORS[notif.type] || 'text-gray-500';

                return (
                  <button
                    key={notif.id}
                    data-testid={`notification-item-${notif.id}`}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${
                      notif.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
