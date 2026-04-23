import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  format,
  differenceInDays,
} from 'date-fns';
import type { Board, Column, Item, ColumnValue } from '../../types/index';

interface TimelineViewProps {
  board: Board;
  items: Item[];
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
}

interface TimelineItem {
  item: Item;
  start: Date;
  end: Date;
  groupColor: string;
}

function getTimelineValue(
  item: Item,
  timelineColumn: Column | undefined,
  dateColumn: Column | undefined
): { start: Date; end: Date } | null {
  if (timelineColumn) {
    const cv = item.columnValues?.find(
      (v: ColumnValue) => v.columnId === timelineColumn.id
    );
    if (cv?.value) {
      const val = cv.value;
      const startStr = val.start || val.from;
      const endStr = val.end || val.to;
      if (startStr && endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return { start, end };
        }
      }
    }
  }

  if (dateColumn) {
    const cv = item.columnValues?.find(
      (v: ColumnValue) => v.columnId === dateColumn.id
    );
    if (cv?.value) {
      const dateStr =
        typeof cv.value === 'object' && cv.value.date ? cv.value.date : cv.value;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return { start: d, end: d };
      }
    }
  }

  return null;
}

export function TimelineView({
  board,
  items,
  // Dispatch props accepted for BoardView-level API symmetry but
  // not yet wired — Timeline edits are Slice 22+ territory.
  onItemUpdate: _onItemUpdate,
  onItemCreate: _onItemCreate,
  onItemDelete: _onItemDelete,
}: TimelineViewProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [scale, setScale] = useState<'weeks' | 'months'>('weeks');

  const timelineColumn = board.columns?.find((c) => c.columnType === 'timeline');
  const dateColumn = board.columns?.find((c) => c.columnType === 'date');
  const groups = (board.groups || []).sort((a, b) => a.position - b.position);

  const viewStart = startOfMonth(viewDate);
  const viewEnd =
    scale === 'weeks'
      ? addDays(viewStart, 42)
      : addDays(endOfMonth(addMonths(viewStart, 2)), 0);

  const totalDays = differenceInDays(viewEnd, viewStart) + 1;
  const dayWidth = scale === 'weeks' ? 40 : 14;

  const weeks = eachWeekOfInterval(
    { start: viewStart, end: viewEnd },
    { weekStartsOn: 1 }
  );

  const timelineItems: TimelineItem[] = useMemo(() => {
    return items
      .map((item) => {
        const range = getTimelineValue(item, timelineColumn, dateColumn);
        if (!range) return null;
        const groupColor =
          groups.find((g) => g.id === item.groupId)?.color || '#6B7280';
        return {
          item,
          start: range.start,
          end: range.end,
          groupColor,
        };
      })
      .filter(Boolean) as TimelineItem[];
  }, [items, timelineColumn, dateColumn, groups]);

  if (!timelineColumn && !dateColumn) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No timeline or date column found. Add one to use the timeline view.
        </p>
      </div>
    );
  }

  function getBarStyle(tItem: TimelineItem): React.CSSProperties {
    const startOffset = Math.max(0, differenceInDays(tItem.start, viewStart));
    const endOffset = Math.min(
      totalDays,
      differenceInDays(tItem.end, viewStart) + 1
    );
    const duration = Math.max(1, endOffset - startOffset);

    return {
      left: `${startOffset * dayWidth}px`,
      width: `${duration * dayWidth - 4}px`,
    };
  }

  const today = new Date();
  const todayOffset = differenceInDays(today, viewStart);
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className="text-sm px-3 py-1 hover:bg-gray-100 rounded-md transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700 ml-2">
            {format(viewStart, 'MMM yyyy')} &mdash;{' '}
            {format(viewEnd, 'MMM yyyy')}
          </span>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setScale('weeks')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              scale === 'weeks'
                ? 'bg-white shadow-sm text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Weeks
          </button>
          <button
            onClick={() => setScale('months')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              scale === 'months'
                ? 'bg-white shadow-sm text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Months
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex">
          <div className="flex-shrink-0 w-[220px] bg-gray-50 border-r border-gray-200 z-10">
            <div className="h-[50px] border-b border-gray-200 flex items-center px-3">
              <span className="text-xs font-medium text-gray-500 uppercase">
                Items
              </span>
            </div>
            {timelineItems.map((tItem) => (
              <div
                key={tItem.item.id}
                className="h-[40px] border-b border-gray-100 flex items-center px-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tItem.groupColor }}
                  />
                  <span className="text-sm text-gray-700 truncate">
                    {tItem.item.name}
                  </span>
                </div>
              </div>
            ))}
            {timelineItems.length === 0 && (
              <div className="h-[40px] flex items-center px-3 text-sm text-gray-400">
                No items with dates
              </div>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div style={{ width: `${totalDays * dayWidth}px`, position: 'relative' }}>
              <div className="h-[50px] border-b border-gray-200 flex relative">
                {weeks.map((weekStart: Date, idx: number) => {
                  const weekOffset = differenceInDays(weekStart, viewStart);
                  if (weekOffset < 0) return null;
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 h-full border-l border-gray-200 flex items-center"
                      style={{ left: `${weekOffset * dayWidth}px` }}
                    >
                      <span className="text-[10px] text-gray-500 px-1 whitespace-nowrap">
                        {format(weekStart, 'MMM d')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {timelineItems.map((tItem) => {
                const barStyle = getBarStyle(tItem);
                return (
                  <div
                    key={tItem.item.id}
                    className="h-[40px] border-b border-gray-100 relative"
                  >
                    <div
                      className="absolute top-[8px] h-[24px] rounded-md flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        ...barStyle,
                        backgroundColor: tItem.groupColor,
                        minWidth: '20px',
                      }}
                      title={`${tItem.item.name}: ${format(tItem.start, 'MMM d')} - ${format(tItem.end, 'MMM d')}`}
                    >
                      <span className="truncate">
                        {parseInt(barStyle.width as string) > 60
                          ? tItem.item.name
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}

              {showTodayLine && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                  style={{
                    left: `${todayOffset * dayWidth + dayWidth / 2}px`,
                  }}
                >
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
