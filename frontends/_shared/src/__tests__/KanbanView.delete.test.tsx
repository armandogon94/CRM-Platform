// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanView } from '../components/board/KanbanView';
import type { Board, Item } from '../types/index';

/**
 * B1: Kanban card delete affordance tests.
 *
 * KanbanView already accepts an `onItemDelete` prop (exposed since
 * Slice 16) but never rendered UI to trigger it. B1 adds the missing
 * kebab menu + ConfirmDialog flow per SPEC §Slice 20 Flow D.
 *
 * Tests cover the full interaction: kebab visible only when the
 * delete callback is wired, menu opens, confirmation has the item
 * name interpolated, ARIA dialog semantics, Escape/Cancel abort,
 * Confirm fires the callback exactly once.
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
  groups: [{ id: 1, boardId: 1, name: 'Open', color: '#60A5FA', position: 0, isCollapsed: false }],
  columns: [STATUS_COLUMN],
  views: [],
};

const ITEMS: Item[] = [
  {
    id: 10,
    boardId: 1,
    groupId: 1,
    name: 'Acme deal',
    position: 0,
    createdBy: 1,
    columnValues: [
      { id: 100, itemId: 10, columnId: 5, value: { label: 'Open', color: '#60A5FA' } },
    ],
  },
  {
    id: 11,
    boardId: 1,
    groupId: 1,
    name: 'Contoso renewal',
    position: 1,
    createdBy: 1,
    columnValues: [
      { id: 101, itemId: 11, columnId: 5, value: { label: 'Open', color: '#60A5FA' } },
    ],
  },
];

describe('KanbanView — card delete affordance', () => {
  let onItemDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onItemDelete = vi.fn();
  });

  describe('kebab button visibility', () => {
    it('renders the kebab button on every card when onItemDelete is provided', () => {
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      const buttons = screen.getAllByRole('button', { name: /item actions/i });
      expect(buttons).toHaveLength(ITEMS.length);
    });

    it('does NOT render the kebab button when onItemDelete is not provided', () => {
      render(<KanbanView board={BOARD} items={ITEMS} />);
      const buttons = screen.queryAllByRole('button', { name: /item actions/i });
      expect(buttons).toHaveLength(0);
    });

    it('kebab button carries aria-label="Item actions"', () => {
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      const btn = screen.getAllByRole('button', { name: /item actions/i })[0];
      expect(btn.getAttribute('aria-label')).toBe('Item actions');
    });
  });

  describe('kebab menu → delete option', () => {
    it('clicking the kebab reveals a Delete menu item', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      const kebab = screen.getAllByRole('button', { name: /item actions/i })[0];
      await user.click(kebab);
      const deleteOption = screen.getByRole('menuitem', { name: /delete/i });
      expect(deleteOption).toBeTruthy();
    });
  });

  describe('confirmation dialog', () => {
    it('clicking Delete opens a confirmation dialog with the item name interpolated', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      const kebab = screen.getAllByRole('button', { name: /item actions/i })[0];
      await user.click(kebab);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(dialog.textContent).toContain('Acme deal');
    });

    it('dialog has role="dialog" and aria-labelledby pointing at the title', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      await user.click(screen.getAllByRole('button', { name: /item actions/i })[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      const titleEl = document.getElementById(titleId!);
      expect(titleEl).toBeTruthy();
    });

    it('confirm fires onItemDelete(itemId) exactly once', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      await user.click(screen.getAllByRole('button', { name: /item actions/i })[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(onItemDelete).toHaveBeenCalledTimes(1);
      expect(onItemDelete).toHaveBeenCalledWith(10);
    });

    it('cancel closes the dialog without firing onItemDelete', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      await user.click(screen.getAllByRole('button', { name: /item actions/i })[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onItemDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('Escape key closes the dialog without firing onItemDelete', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      await user.click(screen.getAllByRole('button', { name: /item actions/i })[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      await user.keyboard('{Escape}');

      expect(onItemDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('the correct item id is passed when deleting the second card', async () => {
      const user = userEvent.setup();
      render(
        <KanbanView board={BOARD} items={ITEMS} onItemDelete={onItemDelete} />
      );
      const kebabs = screen.getAllByRole('button', { name: /item actions/i });
      await user.click(kebabs[1]); // second card
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(onItemDelete).toHaveBeenCalledWith(11);
    });
  });
});
