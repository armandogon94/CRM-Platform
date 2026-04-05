import { StatusBadge } from './StatusBadge';
import type { Board, Column, Item, ColumnValue } from '../types';

interface KanbanViewProps {
  board: Board;
  items: Item[];
}

function getStatusValue(item: Item, statusColumn: Column | undefined): { label: string; color: string } | null {
  if (!statusColumn) return null;
  const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === statusColumn.id);
  return cv?.value as { label: string; color: string } | null;
}

export function KanbanView({ board, items }: KanbanViewProps) {
  const statusColumn = board.columns?.find((c) => c.columnType === 'status');
  const statusOptions = (statusColumn?.config as { options?: { label: string; color: string }[] })?.options || [];

  const columns = statusOptions.map((opt) => ({
    ...opt,
    items: items.filter((item) => {
      const val = getStatusValue(item, statusColumn);
      return val?.label === opt.label;
    }),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.label} className="flex-shrink-0 w-72">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: col.color }}
            />
            <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2">
            {col.items.map((item) => (
              <div
                key={item.id}
                className="card p-3 hover:shadow-md transition-shadow cursor-pointer"
                style={{ borderLeftWidth: 3, borderLeftColor: col.color }}
              >
                <p className="font-medium text-sm text-gray-900 mb-2">{item.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {board.columns
                    ?.filter((c) => c.columnType !== 'status' && c.columnType !== 'long_text')
                    .slice(0, 3)
                    .map((c) => {
                      const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === c.id);
                      if (!cv?.value) return null;
                      if (c.columnType === 'dropdown') {
                        const v = cv.value as { label: string; color: string };
                        return <StatusBadge key={c.id} label={v.label} color={v.color} />;
                      }
                      if (c.columnType === 'number') {
                        const config = c.config as { format?: string };
                        if (config.format === 'currency') {
                          return (
                            <span key={c.id} className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                              ${Number(cv.value).toLocaleString()}
                            </span>
                          );
                        }
                      }
                      return null;
                    })}
                </div>
              </div>
            ))}
            {col.items.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
