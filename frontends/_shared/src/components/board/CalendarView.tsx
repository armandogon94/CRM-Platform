import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import type { Board, Column, Item, ColumnValue } from '../../types/index';

interface CalendarViewProps {
  board: Board;
  items: Item[];
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
}

function getDateValue(item: Item, dateColumn: Column | undefined): Date | null {
  if (!dateColumn) return null;
  const cv = item.columnValues?.find(
    (v: ColumnValue) => v.columnId === dateColumn.id
  );
  if (!cv?.value) return null;
  const dateStr =
    typeof cv.value === 'object' && cv.value.date ? cv.value.date : cv.value;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function getGroupColor(item: Item, groups: Board['groups']): string {
  const group = groups?.find((g) => g.id === item.groupId);
  return group?.color || '#6B7280';
}

export function CalendarView({
  board,
  items,
  onItemUpdate,
  onItemCreate,
  onItemDelete,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const dateColumn = board.columns?.find((c) => c.columnType === 'date');

  const itemsByDate = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((item) => {
      const d = getDateValue(item, dateColumn);
      if (d) {
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) || [];
        existing.push(item);
        map.set(key, existing);
      }
    });
    return map;
  }, [items, dateColumn]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const selectedDayItems = selectedDay
    ? itemsByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : [];

  if (!dateColumn) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No date column found. Add a date column to use the calendar view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-sm px-3 py-1 hover:bg-gray-100 rounded-md transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 -mt-4">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(key) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isTodayDate = isToday(day);

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(day)}
              className={`bg-white min-h-[100px] p-1.5 text-left transition-colors hover:bg-blue-50 ${
                !isCurrentMonth ? 'opacity-40' : ''
              } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isTodayDate ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] text-gray-400">
                    {dayItems.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="text-[11px] leading-tight px-1.5 py-0.5 rounded truncate text-white font-medium"
                    style={{
                      backgroundColor: getGroupColor(item, board.groups),
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-gray-400 px-1.5">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-gray-900">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          {selectedDayItems.length > 0 ? (
            <div className="space-y-2">
              {selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getGroupColor(item, board.groups),
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No items on this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
