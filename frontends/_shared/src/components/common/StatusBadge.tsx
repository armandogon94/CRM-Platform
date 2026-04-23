
interface StatusBadgeProps {
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const dotSizes: Record<string, string> = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
};

export function StatusBadge({ label, color, size = 'md', onClick }: StatusBadgeProps) {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
      onClick={onClick}
    >
      <span
        className={`${dotSizes[size]} rounded-full flex-shrink-0`}
        style={{ backgroundColor: color }}
      />
      {label}
    </Component>
  );
}
