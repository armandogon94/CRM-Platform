import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardView } from './BoardView';
import { makeBoard, makeItem, makeBoardView } from '@/test/fixtures';

vi.mock('./TableView', () => ({ TableView: () => <div>TableView</div> }));
vi.mock('./KanbanView', () => ({ KanbanView: () => <div>KanbanView</div> }));
vi.mock('./CalendarView', () => ({ CalendarView: () => <div>CalendarView</div> }));
vi.mock('./DashboardView', () => ({ DashboardView: () => <div>DashboardView</div> }));
vi.mock('./MapView', () => ({ MapView: () => <div>MapView</div> }));
vi.mock('./ChartView', () => ({ ChartView: () => <div>ChartView</div> }));
vi.mock('./FormView', () => ({ FormView: () => <div>FormView</div> }));
vi.mock('./TimelineView', () => ({ TimelineView: () => <div>TimelineView</div> }));

const board = makeBoard();
const items = [makeItem()];
const noop = vi.fn();

describe('BoardView (view router)', () => {
  it('viewType "table" renders TableView', () => {
    const view = makeBoardView({ viewType: 'table' });
    render(
      <BoardView
        board={board}
        items={items}
        currentView={view}
        onItemUpdate={noop}
        onItemCreate={noop}
        onItemDelete={noop}
      />
    );
    expect(screen.getByText('TableView')).toBeInTheDocument();
  });

  it('viewType "kanban" renders KanbanView', () => {
    const view = makeBoardView({ viewType: 'kanban' });
    render(
      <BoardView
        board={board}
        items={items}
        currentView={view}
        onItemUpdate={noop}
        onItemCreate={noop}
        onItemDelete={noop}
      />
    );
    expect(screen.getByText('KanbanView')).toBeInTheDocument();
  });

  it('viewType "calendar" renders CalendarView', () => {
    const view = makeBoardView({ viewType: 'calendar' });
    render(
      <BoardView
        board={board}
        items={items}
        currentView={view}
        onItemUpdate={noop}
        onItemCreate={noop}
        onItemDelete={noop}
      />
    );
    expect(screen.getByText('CalendarView')).toBeInTheDocument();
  });

  it('viewType "dashboard" renders DashboardView', () => {
    const view = makeBoardView({ viewType: 'dashboard' });
    render(
      <BoardView
        board={board}
        items={items}
        currentView={view}
        onItemUpdate={noop}
        onItemCreate={noop}
        onItemDelete={noop}
      />
    );
    expect(screen.getByText('DashboardView')).toBeInTheDocument();
  });

  it('viewType "map" renders MapView', () => {
    const view = makeBoardView({ viewType: 'map' });
    render(
      <BoardView
        board={board}
        items={items}
        currentView={view}
        onItemUpdate={noop}
        onItemCreate={noop}
        onItemDelete={noop}
      />
    );
    expect(screen.getByText('MapView')).toBeInTheDocument();
  });

  it('viewType "timeline" renders TimelineView', () => {
    const view = makeBoardView({ viewType: 'timeline' });
    render(
      <BoardView board={board} items={items} currentView={view}
        onItemUpdate={noop} onItemCreate={noop} onItemDelete={noop} />
    );
    expect(screen.getByText('TimelineView')).toBeInTheDocument();
  });

  it('viewType "chart" renders ChartView', () => {
    const view = makeBoardView({ viewType: 'chart' });
    render(
      <BoardView board={board} items={items} currentView={view}
        onItemUpdate={noop} onItemCreate={noop} onItemDelete={noop} />
    );
    expect(screen.getByText('ChartView')).toBeInTheDocument();
  });

  it('viewType "form" renders FormView', () => {
    const view = makeBoardView({ viewType: 'form' });
    render(
      <BoardView board={board} items={items} currentView={view}
        onItemUpdate={noop} onItemCreate={noop} onItemDelete={noop} />
    );
    expect(screen.getByText('FormView')).toBeInTheDocument();
  });
});
