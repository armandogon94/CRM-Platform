import { useEffect, useRef } from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  User,
  Mail,
  Phone,
  ChevronDown,
  CheckSquare,
  Link,
  Paperclip,
  Calculator,
  Clock,
  Star,
  X,
} from 'lucide-react';

interface ColumnTypeOption {
  type: string;
  name: string;
  description: string;
  icon: typeof Type;
}

const COLUMN_TYPES: ColumnTypeOption[] = [
  { type: 'status', name: 'Status', description: 'Track progress with labels', icon: ChevronDown },
  { type: 'text', name: 'Text', description: 'Short text field', icon: Type },
  { type: 'long_text', name: 'Long Text', description: 'Multi-line text', icon: AlignLeft },
  { type: 'number', name: 'Number', description: 'Numeric values', icon: Hash },
  { type: 'date', name: 'Date', description: 'Date picker', icon: Calendar },
  { type: 'person', name: 'Person', description: 'Assign team members', icon: User },
  { type: 'email', name: 'Email', description: 'Email addresses', icon: Mail },
  { type: 'phone', name: 'Phone', description: 'Phone numbers', icon: Phone },
  { type: 'dropdown', name: 'Dropdown', description: 'Select from options', icon: ChevronDown },
  { type: 'checkbox', name: 'Checkbox', description: 'Yes/No toggle', icon: CheckSquare },
  { type: 'url', name: 'URL', description: 'Web links', icon: Link },
  { type: 'files', name: 'Files', description: 'Attach files', icon: Paperclip },
  { type: 'formula', name: 'Formula', description: 'Calculated values', icon: Calculator },
  { type: 'timeline', name: 'Timeline', description: 'Date ranges', icon: Clock },
  { type: 'rating', name: 'Rating', description: 'Star rating', icon: Star },
];

interface ColumnTypePickerModalProps {
  onSelect: (columnType: string) => void;
  onClose: () => void;
}

export function ColumnTypePickerModal({ onSelect, onClose }: ColumnTypePickerModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      data-testid="column-type-modal-backdrop"
    >
      <div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Column</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto max-h-[60vh]">
          {COLUMN_TYPES.map(({ type, name, description, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-start gap-1 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              data-testid={`column-type-${type}`}
            >
              <Icon size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{name}</span>
              <span className="text-xs text-gray-500 leading-tight">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
