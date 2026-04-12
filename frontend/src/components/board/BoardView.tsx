import React from 'react';
import type { Board, Item, BoardView as BoardViewType } from '../../types';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { ChartView } from './ChartView';
import { FormView } from './FormView';
import { DashboardView } from './DashboardView';
import { MapView } from './MapView';

interface BoardViewProps {
  board: Board;
  items: Item[];
  currentView: BoardViewType;
  onItemUpdate: (itemId: number, columnId: number, value: any) => void;
  onItemCreate: (groupId: number, name: string) => void;
  onItemDelete: (itemId: number) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  items,
  currentView,
  onItemUpdate,
  onItemCreate,
  onItemDelete,
}) => {
  switch (currentView.viewType) {
    case 'table':
      return (
        <TableView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      );
    case 'kanban':
      return (
        <KanbanView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      );
    case 'calendar':
      return <CalendarView board={board} items={items} />;
    case 'timeline':
      return <TimelineView board={board} items={items} />;
    case 'chart':
      return <ChartView board={board} items={items} />;
    case 'form':
      return (
        <FormView
          board={board}
          onSubmit={(name, values) => {
            onItemCreate(board.groups[0]?.id || 0, name);
          }}
        />
      );
    case 'dashboard':
      return <DashboardView board={board} />;
    case 'map':
      return <MapView board={board} items={items} />;
    default:
      return <TableView board={board} items={items} onItemUpdate={onItemUpdate} onItemCreate={onItemCreate} onItemDelete={onItemDelete} />;
  }
};

export default BoardView;
