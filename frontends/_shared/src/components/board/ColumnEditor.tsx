import React, { useState, useRef, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import type { Column } from '../../types/index';
import { FileUploader } from './FileUploader';
import { api } from '../../utils/api';
import type { FileAttachment, Member } from '../../utils/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../common/ToastProvider';
import { PersonAvatar } from '../common/PersonAvatar';

/**
 * Slice 21B C1 — soft cap on multi-assign person columns. Per spec
 * OQ #1, 20 is the chosen ceiling: high enough that real teams rarely
 * brush against it, low enough that runaway assignments stay obvious.
 * Lift only with product sign-off.
 */
const MULTI_ASSIGN_CAP = 20;

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
      // Slice 21B C1 — debounced member-search dropdown. Replaces the
      // free-text stub with a real workspace lookup driven by Phase A's
      // GET /workspaces/:id/members and Phase B's `searchMembers` +
      // `useDebounce`. Single-assign vs multi-assign is gated by
      // `column.config.allow_multiple` (defaults to false — single).
      const allowMultiple =
        (column.config as { allow_multiple?: boolean })?.allow_multiple === true;

      // Workspace context drives the search scope. Reading via hook (not
      // a prop) matches the `case 'files':` precedent in 21A C1 and
      // avoids threading workspaceId through every Cell-level editor.
      const ws = useWorkspace().workspace;
      const workspaceId = ws?.id ?? 0;

      const toast = useToast();
      const [search, setSearch] = useState('');
      const [members, setMembers] = useState<Member[]>([]);
      // 300ms trailing-edge debounce — same window as Monday.com's
      // person picker; balances "feels instant" with "doesn't hammer
      // the API on every keystroke".
      const debouncedSearch = useDebounce(search, 300);

      // Normalise the cell value into an array of Member-shaped objects.
      // Single-assign stores a single Member or null; multi-assign stores
      // Member[]. Either way the UI reads from `currentAssignees` so the
      // chip stack works for both modes (single ends up as a 1-length
      // chip stack — visually equivalent, behaviourally simple).
      const currentAssignees: Member[] = allowMultiple
        ? (Array.isArray(value) ? (value as Member[]) : [])
        : (value ? [value as Member] : []);

      const atCap = allowMultiple && currentAssignees.length >= MULTI_ASSIGN_CAP;

      useEffect(() => {
        // AbortController plumbing → cancel stale in-flight requests
        // when a newer keystroke fires (plan ADR / OQ #3). Debounce
        // alone only cancels pending timers; without abort, a slow
        // earlier fetch could resolve after a fast later one and
        // out-of-order setMembers.
        const controller = new AbortController();
        api.workspaces
          .searchMembers(workspaceId, debouncedSearch, {
            signal: controller.signal,
          })
          .then((res) => {
            if (res.success && res.data) {
              setMembers(res.data.members);
            }
          });
        return () => controller.abort();
      }, [debouncedSearch, workspaceId]);

      const removeAssignee = (id: number) => {
        if (allowMultiple) {
          const next = currentAssignees.filter((m) => m.id !== id);
          onChange(next);
        } else {
          // Single-assign: remove === clear.
          onChange(null);
        }
      };

      const assign = (member: Member) => {
        // Cap guard for multi-assign — defence in depth: the button is
        // also disabled at-cap, but the click handler stays explicit so
        // future call sites (keyboard, A11y) can't bypass the cap.
        if (atCap) {
          toast.show({
            variant: 'warning',
            title: 'Maximum 20 assignees per column',
          });
          return;
        }

        if (allowMultiple) {
          // Append + dedupe by id (the row button is also disabled when
          // already-assigned, but a stale render shouldn't be able to
          // double-assign).
          if (currentAssignees.some((a) => a.id === member.id)) return;
          onChange([...currentAssignees, member]);
          // Picker stays open for multi-assign — explicit non-call to
          // onBlur. User clicks outside / Escape / Done to close.
        } else {
          onChange(member);
          onBlur?.();
        }
      };

      const clearAll = () => {
        // Multi-assign convenience — wipe the whole array. We use [] not
        // null so downstream JSON serialisation stays consistent (an
        // empty array round-trips as `[]` rather than `null`).
        onChange([]);
      };

      return (
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[240px]"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onBlur?.();
          }}
        >
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
          />

          {currentAssignees.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {currentAssignees.map((m) => {
                const name = `${m.firstName} ${m.lastName}`.trim() || m.email;
                return (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full pl-1 pr-2 py-0.5 text-xs"
                  >
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <PersonAvatar name={name} avatar={null} size="sm" />
                    )}
                    <span>{name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => removeAssignee(m.id)}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {allowMultiple && currentAssignees.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-red-600 mb-2"
            >
              Clear all
            </button>
          )}

          <div className="max-h-60 overflow-y-auto">
            {members.map((m) => {
              const name = `${m.firstName} ${m.lastName}`.trim() || m.email;
              const alreadyAssigned = currentAssignees.some((a) => a.id === m.id);
              // `alreadyAssigned` is a hard no-op (HTML `disabled` so the
              // browser blocks the click entirely). `atCap` uses
              // `aria-disabled` + click-handler short-circuit so the
              // overflow click still fires and surfaces a toast — per
              // spec, "emit a warning toast on attempted overflow click".
              // Native `disabled` would swallow the event and the user
              // would get no feedback.
              const blockedByCap = atCap && !alreadyAssigned;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => assign(m)}
                  disabled={alreadyAssigned}
                  aria-disabled={alreadyAssigned || blockedByCap}
                  title={blockedByCap ? 'Maximum 20 assignees per column' : undefined}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                    alreadyAssigned || blockedByCap
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <PersonAvatar name={name} avatar={null} size="md" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-900 truncate">{name}</span>
                    <span className="text-xs text-gray-500 truncate">{m.email}</span>
                  </div>
                </button>
              );
            })}
            {members.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-4">
                No members found
              </div>
            )}
          </div>

          {allowMultiple && (
            <button
              type="button"
              onClick={() => onBlur?.()}
              className="w-full mt-2 text-sm text-center bg-gray-100 hover:bg-gray-200 py-1 rounded transition-colors"
            >
              Done
            </button>
          )}
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
