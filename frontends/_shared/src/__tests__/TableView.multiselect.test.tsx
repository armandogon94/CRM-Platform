// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableView } from '../components/board/TableView';
import type { Board, Item } from '../types/index';

/**
 * Slice 21C — Phase B1: TableView multi-select state machine.
 *
 * Covers click semantics from SPEC §Slice 21C lines 2104-2111:
 *   - Bare click → replaces selection
 *   - Cmd/Ctrl+click → toggles
 *   - Shift+click → range from lastClickedId, ADDS to existing selection
 *   - Header checkbox → toggle select-all-VISIBLE (ADR 21C-1)
 *   - Escape → clears (only when size > 0)
 *   - Cell content click (status badge) → starts edit, does NOT select
 *   - Filter change → clears (ADR 21C-3)
 *   - Sort change → preserves (ADR 21C-3)
 *
 * Selection state lives inside TableView. Phase D will lift via
 * `onSelectionChange` callback prop; tests here observe the rendered
 * checkbox state since that's the user-visible signal.
 */

const STATUS_COLUMN = {
  id: 5,
  boardId: 1,
  name: 'Status',
  columnType: 'status',
  config: {
    options: [
      { label: 'Open', color: '#60A5FA', order: 0 },
      { label: 'Closed', color: '#34D399', order: 1 },
    ],
  },
  position: 0,
  width: 140,
  isRequired: false,
};

const BOARD: Board = {
  id: 1,
  name: 'Pipeline',
  description: null,
  workspaceId: 1,
  boardType: 'main',
  groups: [
    { id: 1, boardId: 1, name: 'Active', color: '#60A5FA', position: 0, isCollapsed: false },
    { id: 2, boardId: 1, name: 'Done', color: '#34D399', position: 1, isCollapsed: false },
  ],
  columns: [STATUS_COLUMN],
  views: [],
};

function makeItem(id: number, groupId: number, name: string): Item {
  return {
    id,
    boardId: 1,
    groupId,
    name,
    position: id,
    createdBy: 1,
    columnValues: [
      { id: id * 100, itemId: id, columnId: 5, value: { label: 'Open', color: '#60A5FA' } },
    ],
  };
}

const ITEMS: Item[] = [
  makeItem(10, 1, 'Row A'),
  makeItem(11, 1, 'Row B'),
  makeItem(12, 1, 'Row C'),
  makeItem(13, 2, 'Row D'),
  makeItem(14, 2, 'Row E'),
];

function getRowCheckbox(itemId: number): HTMLInputElement {
  return screen.getByTestId(`row-checkbox-${itemId}`) as HTMLInputElement;
}

function getHeaderCheckboxes(): HTMLInputElement[] {
  return screen.getAllByTestId('header-checkbox') as HTMLInputElement[];
}

describe('TableView — multi-select state (Slice 21C B1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bare row click selects only that row (replaces prior selection)', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    // Pre-select a different row via Cmd+click
    await user.keyboard('{Meta>}');
    await user.click(getRowCheckbox(10));
    await user.keyboard('{/Meta}');
    expect(getRowCheckbox(10).checked).toBe(true);

    // Plain click on row 11 → replaces (10 is unchecked, only 11 is checked)
    await user.click(getRowCheckbox(11));
    expect(getRowCheckbox(10).checked).toBe(false);
    expect(getRowCheckbox(11).checked).toBe(true);
  });

  it('Cmd+click toggles row in/out of selection', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    await user.keyboard('{Meta>}');
    await user.click(getRowCheckbox(10));
    expect(getRowCheckbox(10).checked).toBe(true);

    await user.click(getRowCheckbox(11));
    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(11).checked).toBe(true);

    // Toggle 10 back off
    await user.click(getRowCheckbox(10));
    await user.keyboard('{/Meta}');
    expect(getRowCheckbox(10).checked).toBe(false);
    expect(getRowCheckbox(11).checked).toBe(true);
  });

  it('Shift+click selects range from lastClickedId to current (additive)', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    // Anchor on row 10
    await user.click(getRowCheckbox(10));
    expect(getRowCheckbox(10).checked).toBe(true);

    // Shift-click row 13 → selects 10, 11, 12, 13 (range from anchor)
    await user.keyboard('{Shift>}');
    await user.click(getRowCheckbox(13));
    await user.keyboard('{/Shift}');

    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(11).checked).toBe(true);
    expect(getRowCheckbox(12).checked).toBe(true);
    expect(getRowCheckbox(13).checked).toBe(true);
    expect(getRowCheckbox(14).checked).toBe(false);
  });

  it('header checkbox with empty selection selects all visible items', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    // Click first header checkbox (group 1)
    const headers = getHeaderCheckboxes();
    expect(headers.length).toBeGreaterThanOrEqual(1);

    // Click ALL header checkboxes to select everything
    for (const header of headers) {
      await user.click(header);
    }

    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(11).checked).toBe(true);
    expect(getRowCheckbox(12).checked).toBe(true);
    expect(getRowCheckbox(13).checked).toBe(true);
    expect(getRowCheckbox(14).checked).toBe(true);
  });

  it('header checkbox with all-visible-selected → clears (UX expectation)', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    // Select all rows manually via Cmd+click
    await user.keyboard('{Meta>}');
    for (const id of [10, 11, 12, 13, 14]) {
      await user.click(getRowCheckbox(id));
    }
    await user.keyboard('{/Meta}');

    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(14).checked).toBe(true);

    // Click each group header → toggles off (since group is all-selected)
    const headers = getHeaderCheckboxes();
    for (const header of headers) {
      await user.click(header);
    }

    // All rows now unselected
    expect(getRowCheckbox(10).checked).toBe(false);
    expect(getRowCheckbox(11).checked).toBe(false);
    expect(getRowCheckbox(12).checked).toBe(false);
    expect(getRowCheckbox(13).checked).toBe(false);
    expect(getRowCheckbox(14).checked).toBe(false);
  });

  it('Escape clears selection only when size > 0', async () => {
    const user = userEvent.setup();
    const { container } = render(<TableView board={BOARD} items={ITEMS} />);

    // No-op when nothing selected: just press Escape; nothing should break
    await user.keyboard('{Escape}');
    expect(getRowCheckbox(10).checked).toBe(false);

    // Select one
    await user.click(getRowCheckbox(10));
    expect(getRowCheckbox(10).checked).toBe(true);

    // Escape clears
    await user.keyboard('{Escape}');
    expect(getRowCheckbox(10).checked).toBe(false);
    // sanity: container still rendered
    expect(container.querySelector('[data-testid="table-view"]')).not.toBeNull();
  });

  it('clicking edit-eligible cell content (status badge) does NOT change selection', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    // Pre-select row 10 via checkbox
    await user.click(getRowCheckbox(10));
    expect(getRowCheckbox(10).checked).toBe(true);

    // Click row 11's status cell content — should open editor, NOT replace selection
    const statusCells = screen.getAllByTestId('cell-status');
    // statusCells[1] corresponds to row 11
    await user.click(statusCells[1]);

    // Selection on row 10 must persist — clicking inside an edit-eligible cell
    // does not collapse the selection to row 11 (stopPropagation in cell handler)
    expect(getRowCheckbox(10).checked).toBe(true);
    // Row 11 is NOT additionally selected from this click
    expect(getRowCheckbox(11).checked).toBe(false);
  });

  it('filter change (items prop replaced with filtered subset) clears selection', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TableView board={BOARD} items={ITEMS} filterKey="all" />
    );

    await user.keyboard('{Meta>}');
    await user.click(getRowCheckbox(10));
    await user.click(getRowCheckbox(11));
    await user.keyboard('{/Meta}');
    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(11).checked).toBe(true);

    // Simulate filter change: prop key changes (parent owns filtering — TableView
    // observes the signal). All rows still rendered to keep the assertion simple.
    rerender(<TableView board={BOARD} items={ITEMS} filterKey="status:open" />);

    expect(getRowCheckbox(10).checked).toBe(false);
    expect(getRowCheckbox(11).checked).toBe(false);
  });

  it('sort change preserves selection (items array reordered, same ids)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TableView board={BOARD} items={ITEMS} filterKey="all" />
    );

    await user.keyboard('{Meta>}');
    await user.click(getRowCheckbox(10));
    await user.click(getRowCheckbox(11));
    await user.keyboard('{/Meta}');
    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(11).checked).toBe(true);

    // Re-sort: same ids, reversed order, same filterKey → selection preserved
    const reversed = [...ITEMS].reverse();
    rerender(<TableView board={BOARD} items={reversed} filterKey="all" />);

    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(11).checked).toBe(true);
  });

  it('multi-group selection — items from different groups can be selected together (ADR 21C-2)', async () => {
    const user = userEvent.setup();
    render(<TableView board={BOARD} items={ITEMS} />);

    await user.keyboard('{Meta>}');
    await user.click(getRowCheckbox(10)); // group 1
    await user.click(getRowCheckbox(13)); // group 2
    await user.keyboard('{/Meta}');

    expect(getRowCheckbox(10).checked).toBe(true);
    expect(getRowCheckbox(13).checked).toBe(true);
    // Rows in between unselected (Cmd+click is toggle, not range)
    expect(getRowCheckbox(11).checked).toBe(false);
    expect(getRowCheckbox(12).checked).toBe(false);
  });
});
