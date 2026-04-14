import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableView } from './TableView';
import {
  makeBoard,
  makeGroup,
  makeColumn,
  makeItem,
  makeColumnValue,
  MOCK_BOARD,
  MOCK_ITEMS,
  STATUS_COLUMN,
  TEXT_COLUMN,
} from '@/test/fixtures';

vi.mock('./ColumnRenderer', () => ({
  ColumnRenderer: ({ column, value }: any) => (
    <span data-testid={`renderer-${column.id}`}>{String(value ?? '-')}</span>
  ),
}));

vi.mock('./ColumnEditor', () => ({
  ColumnEditor: ({ column }: any) => (
    <input data-testid={`editor-${column.id}`} />
  ),
}));

describe('TableView', () => {
  const defaultProps = {
    board: MOCK_BOARD,
    items: MOCK_ITEMS,
    onItemCreate: vi.fn(),
    onItemUpdate: vi.fn(),
    onItemDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when board has no groups', () => {
    const board = makeBoard({ groups: [], columns: [] });
    render(<TableView board={board} items={[]} />);
    expect(
      screen.getByText(/no groups configured/i)
    ).toBeInTheDocument();
  });

  it('renders group headers with name, color swatch, and item count', () => {
    render(<TableView {...defaultProps} />);

    // Both group names should be visible
    expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    expect(screen.getByText('Sprint 2')).toBeInTheDocument();

    // Item counts: Sprint 1 has 2 items, Sprint 2 has 1 item
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
    expect(screen.getByText(/1 item/i)).toBeInTheDocument();
  });

  it('renders items under their respective groups', () => {
    render(<TableView {...defaultProps} />);

    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Item Two')).toBeInTheDocument();
    expect(screen.getByText('Item Three')).toBeInTheDocument();
  });

  it('renders column headers for each column', () => {
    render(<TableView {...defaultProps} />);

    // STATUS_COLUMN name = 'Status', TEXT_COLUMN name = 'Notes'
    // Both groups render their own thead, so use getAllByText
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Notes').length).toBeGreaterThan(0);
  });

  it('collapses a group when its header button is clicked', () => {
    render(<TableView {...defaultProps} />);

    // Before collapse, items in Sprint 1 are visible
    expect(screen.getByText('Item One')).toBeInTheDocument();

    // Click the first group header button (Sprint 1)
    const groupButtons = screen.getAllByRole('button', { hidden: true });
    // Find the Sprint 1 button — it contains the text "Sprint 1"
    const sprint1Button = groupButtons.find((btn) =>
      btn.textContent?.includes('Sprint 1')
    );
    expect(sprint1Button).toBeDefined();
    fireEvent.click(sprint1Button!);

    // After collapse, Sprint 1 items should be hidden
    expect(screen.queryByText('Item One')).not.toBeInTheDocument();
    expect(screen.queryByText('Item Two')).not.toBeInTheDocument();
    // Sprint 2 items should still be visible
    expect(screen.getByText('Item Three')).toBeInTheDocument();
  });

  it('enters edit mode when a non-formula cell is clicked', () => {
    const group = makeGroup({ id: 100, name: 'Group A', position: 0 });
    const col = makeColumn({
      id: 202,
      name: 'Notes',
      columnType: 'text',
      position: 0,
    });
    const item = makeItem({
      id: 1,
      groupId: 100,
      name: 'Editable Item',
      columnValues: [],
    });
    const board = makeBoard({ groups: [group], columns: [col] });

    render(
      <TableView
        board={board}
        items={[item]}
        onItemCreate={vi.fn()}
        onItemUpdate={vi.fn()}
        onItemDelete={vi.fn()}
      />
    );

    // ColumnRenderer should be visible before click
    expect(screen.getByTestId('renderer-202')).toBeInTheDocument();

    // Click the td containing the renderer
    const rendererCell = screen.getByTestId('renderer-202').closest('td');
    expect(rendererCell).toBeDefined();
    fireEvent.click(rendererCell!);

    // ColumnEditor should now be shown
    expect(screen.getByTestId('editor-202')).toBeInTheDocument();
  });

  it('does not enter edit mode when a formula column cell is clicked', () => {
    const group = makeGroup({ id: 100, name: 'Group A', position: 0 });
    const formulaCol = makeColumn({
      id: 210,
      name: 'Computed',
      columnType: 'formula',
      position: 0,
    });
    const item = makeItem({
      id: 1,
      groupId: 100,
      name: 'Formula Item',
      columnValues: [],
    });
    const board = makeBoard({ groups: [group], columns: [formulaCol] });

    render(
      <TableView
        board={board}
        items={[item]}
        onItemCreate={vi.fn()}
        onItemUpdate={vi.fn()}
        onItemDelete={vi.fn()}
      />
    );

    // ColumnRenderer should be visible
    expect(screen.getByTestId('renderer-210')).toBeInTheDocument();

    // Click the formula cell
    const formulaCell = screen.getByTestId('renderer-210').closest('td');
    fireEvent.click(formulaCell!);

    // ColumnEditor should NOT appear
    expect(screen.queryByTestId('editor-210')).not.toBeInTheDocument();
    // Renderer should still be present
    expect(screen.getByTestId('renderer-210')).toBeInTheDocument();
  });

  it('shows the add item input and calls onItemCreate on Enter', () => {
    const onItemCreate = vi.fn();
    render(<TableView {...defaultProps} onItemCreate={onItemCreate} />);

    // Placeholder text for the add-item input
    const inputs = screen.getAllByPlaceholderText('+ Add item');
    expect(inputs.length).toBeGreaterThan(0);

    // Use the first group's input (Sprint 1, id=100)
    const addInput = inputs[0];
    fireEvent.change(addInput, { target: { value: 'New Task' } });
    fireEvent.keyDown(addInput, { key: 'Enter' });

    expect(onItemCreate).toHaveBeenCalledWith(100, 'New Task');
  });

  it('shows an Add button when text is typed and calls onItemCreate on click', () => {
    const onItemCreate = vi.fn();
    render(<TableView {...defaultProps} onItemCreate={onItemCreate} />);

    const inputs = screen.getAllByPlaceholderText('+ Add item');
    const addInput = inputs[0];

    // No "Add" button initially
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();

    fireEvent.change(addInput, { target: { value: 'Another Task' } });

    // "Add" button should appear
    const addButtons = screen.getAllByRole('button', { name: /^add$/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);
    expect(onItemCreate).toHaveBeenCalledWith(100, 'Another Task');
  });
});
