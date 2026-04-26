import React, { useState, useRef, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import type { Column } from '../../types/index';
import { FileUploader } from './FileUploader';
import type { FileAttachment } from '../../utils/api';
import { useWorkspace } from '../../context/WorkspaceContext';

interface ColumnEditorProps {
  column: Column;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  /**
   * Slice 21A C1 — wiring metadata for cell types that need to resolve
   * back to a server-side row (currently only `files`). Optional so the
   * existing TableView + FormView call sites (which don't surface item
   * IDs into the editor) keep typechecking; when omitted, the `files`
   * case falls back to a read-only render with no upload affordance.
   */
  meta?: { itemId: number; columnValueId?: number };
}

export function ColumnEditor({ column, value, onChange, onBlur, meta }: ColumnEditorProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  switch (column.columnType) {
    case 'status': {
      const options = (column.config as { options?: { label: string; color: string }[] })?.options || [];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[160px]">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                onChange({ label: opt.label, color: opt.color });
                onBlur?.();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: opt.color }}
              />
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      );
    }

    case 'text': {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      );
    }

    case 'long_text': {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={3}
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      );
    }

    case 'number': {
      const config = column.config as { prefix?: string; suffix?: string };
      return (
        <div className="flex items-center gap-1">
          {config.prefix && (
            <span className="text-sm text-gray-500">{config.prefix}</span>
          )}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            onBlur={onBlur}
            onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
            className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            step="any"
          />
          {config.suffix && (
            <span className="text-sm text-gray-500">{config.suffix}</span>
          )}
        </div>
      );
    }

    case 'date': {
      const dateVal =
        typeof value === 'object' && value?.date
          ? value.date
          : value
          ? new Date(value).toISOString().split('T')[0]
          : '';
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={dateVal}
          onChange={(e) => onChange(e.target.value || null)}
          onBlur={onBlur}
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      );
    }

    case 'person': {
      const [search, setSearch] = useState('');
      const currentPersons = Array.isArray(value) ? value : value ? [value] : [];

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a name..."
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
          />
          {currentPersons.length > 0 && (
            <div className="space-y-1 mb-2">
              {currentPersons.map((person: any, idx: number) => {
                const name = typeof person === 'string' ? person : person.name || '';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-blue-50 rounded px-2 py-1"
                  >
                    <span className="text-sm text-blue-700">{name}</span>
                    <button
                      onClick={() => {
                        const updated = currentPersons.filter((_: any, i: number) => i !== idx);
                        onChange(updated.length > 0 ? updated : null);
                      }}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {search.trim() && (
            <button
              onClick={() => {
                const newPerson = { name: search.trim() };
                onChange([...currentPersons, newPerson]);
                setSearch('');
              }}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
            >
              Add &quot;{search.trim()}&quot;
            </button>
          )}
          <button
            onClick={() => onBlur?.()}
            className="w-full mt-2 text-sm text-center bg-gray-100 hover:bg-gray-200 py-1 rounded transition-colors"
          >
            Done
          </button>
        </div>
      );
    }

    case 'email': {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
          placeholder="email@example.com"
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      );
    }

    case 'phone': {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="tel"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
          placeholder="(555) 123-4567"
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      );
    }

    case 'dropdown': {
      const options =
        (column.config as { options?: { label: string; color: string }[] })?.options || [];
      const isMulti = (column.config as { multi?: boolean })?.multi ?? false;
      const currentValues = Array.isArray(value) ? value : value ? [value] : [];
      const selectedLabels = new Set(
        currentValues.map((v: any) => (typeof v === 'string' ? v : v.label))
      );

      if (!isMulti) {
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={typeof value === 'object' ? value?.label : value || ''}
            onChange={(e) => {
              const selected = options.find((o) => o.label === e.target.value);
              onChange(selected ? { label: selected.label, color: selected.color } : null);
              onBlur?.();
            }}
            onBlur={onBlur}
            className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[160px]">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                if (selectedLabels.has(opt.label)) {
                  const updated = currentValues.filter(
                    (v: any) => (typeof v === 'string' ? v : v.label) !== opt.label
                  );
                  onChange(updated.length > 0 ? updated : null);
                } else {
                  onChange([...currentValues, { label: opt.label, color: opt.color }]);
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  selectedLabels.has(opt.label)
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {selectedLabels.has(opt.label) && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                    <path
                      d="M3 6l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: opt.color }}
              />
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
          <button
            onClick={() => onBlur?.()}
            className="w-full mt-1 text-sm text-center bg-gray-100 hover:bg-gray-200 py-1 rounded transition-colors"
          >
            Done
          </button>
        </div>
      );
    }

    case 'checkbox': {
      const isChecked = Boolean(value);
      return (
        <button
          onClick={() => {
            onChange(!isChecked);
            onBlur?.();
          }}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            isChecked
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          {isChecked && (
            <svg className="w-4 h-4" viewBox="0 0 16 16">
              <path
                d="M4 8l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      );
    }

    case 'url': {
      const urlValue = typeof value === 'object' ? value?.url : value;
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="url"
          value={urlValue || ''}
          onChange={(e) => onChange(e.target.value || null)}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
          placeholder="https://..."
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      );
    }

    case 'timeline': {
      const start = value?.start || value?.from || '';
      const end = value?.end || value?.to || '';

      return (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={start ? new Date(start).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange({ start: e.target.value, end })}
            className="border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={end ? new Date(end).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange({ start, end: e.target.value })}
            onBlur={onBlur}
            className="border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      );
    }

    case 'rating': {
      const maxRating = (column.config as { max?: number })?.max || 5;
      const currentRating = Number(value) || 0;

      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxRating }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                onChange(i + 1 === currentRating ? 0 : i + 1);
                onBlur?.();
              }}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                size={18}
                className={
                  i < currentRating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                }
              />
            </button>
          ))}
        </div>
      );
    }

    case 'files': {
      // Files cell value is a FileAttachment[]. Normalize null/object
      // shapes so callers that store `null` for empty cells still render
      // a coherent empty list rather than crashing on `.map`.
      const currentFiles: FileAttachment[] = Array.isArray(value)
        ? (value as FileAttachment[])
        : value
        ? [value as FileAttachment]
        : [];

      // Without `meta` we can't post to the upload route — the route
      // requires an `itemId`. Render the existing list read-only so
      // callers like FormView (which precedes item creation) still see
      // the field; once they pass `meta` the upload UI lights up.
      if (!meta) {
        return (
          <ul className="space-y-1 text-sm" data-testid="file-uploader-readonly">
            {currentFiles.map((file) => (
              <li key={file.id} className="px-2 py-1 rounded bg-gray-50">
                {file.originalName}
              </li>
            ))}
          </ul>
        );
      }

      // Quota budget comes from workspace context — surfaces the same
      // numbers as the BoardView header indicator so the projection
      // check matches the user's mental model. `storageLimit ?? 0`
      // means a workspace without quota set blocks uploads, which is
      // the safer default than letting unbounded uploads through.
      const ws = useWorkspace().workspace;
      const workspaceStorage = {
        used: ws?.storageUsed ?? 0,
        limit: ws?.storageLimit ?? 0,
      };

      return (
        <FileUploader
          itemId={meta.itemId}
          columnValueId={meta.columnValueId}
          files={currentFiles}
          workspaceStorage={workspaceStorage}
          onUploaded={(file) => {
            // Optimistic local update — append the new file to the cell
            // value and propagate via onChange so the row state
            // reconciles immediately. The WS `file:created` echo from
            // Phase D will land the same file shape; useBoard's handler
            // is idempotent on `id`, so no double-apply.
            onChange([...currentFiles, file]);
          }}
          onDeleted={(fileId) => {
            // Mirror of onUploaded — filter the deleted id out and let
            // the WS `file:deleted` echo confirm.
            onChange(currentFiles.filter((f) => f.id !== fileId));
          }}
        />
      );
    }

    default: {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && onBlur?.()}
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      );
    }
  }
}
