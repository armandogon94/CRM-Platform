import React from 'react';

interface PersonAvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const nameSizeClasses: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function PersonAvatar({ name, avatar, size = 'md', showName = false }: PersonAvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  return (
    <div className="inline-flex items-center gap-2">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white flex-shrink-0`}
          style={{ backgroundColor: bgColor }}
          title={name}
        >
          {initials}
        </div>
      )}
      {showName && (
        <span className={`${nameSizeClasses[size]} text-gray-700`}>{name}</span>
      )}
    </div>
  );
}
