// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';
import { ColumnEditor } from '../components/board/ColumnEditor';
import type { Column } from '../types/index';
import type { Member } from '../utils/api';

/**
 * Slice 21B — Phase C1: ColumnEditor `case 'person':` rewrite.
 *
 * The stub previously rendered a free-text "type a name" + Add button —
 * no real workspace member lookup. C1 replaces it with a debounced
 * member-search dropdown driven by `api.workspaces.searchMembers` (B1)
 * and `useDebounce` (B2). Single-assign vs multi-assign is gated by
 * `column.config.allow_multiple`.
 *
 * Strategy:
 *   - Mock `api.workspaces.searchMembers` to assert call shape and
 *     control the response.
 *   - Use `vi.useFakeTimers()` to drive the 300ms debounce deterministically.
 *   - Mock `useWorkspace` so the picker reads workspaceId without
 *     mounting a full WorkspaceProvider (matches the FileUploader test
 *     pattern in ColumnEditor.test.tsx).
 *
 * 5 cases — see plan §C1 RED→GREEN flow.
 */

// ── api mock — keep searchMembers observable + controllable ───────────
const mockSearchMembers = vi.fn();
vi.mock('../utils/api', async () => {
  const actual = await vi.importActual<typeof import('../utils/api')>(
    '../utils/api'
  );
  return {
    ...actual,
    api: {
      ...actual.api,
      workspaces: {
        ...actual.api.workspaces,
        searchMembers: (...args: unknown[]) => mockSearchMembers(...args),
      },
    },
  };
});

// ── workspace mock — provides workspaceId for the search call ─────────
const mockUseWorkspace = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => mockUseWorkspace(),
}));

function setWorkspace(id = 1) {
  mockUseWorkspace.mockReturnValue({
    workspace: {
      id,
      name: 'WS',
      slug: 'ws',
      description: null,
      storageUsed: 0,
      storageLimit: 100 * 1024 * 1024,
    },
    boards: [],
    selectedBoard: null,
    setSelectedBoard: vi.fn(),
    refreshBoards: vi.fn(),
    isLoading: false,
  });
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 1,
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Anderson',
    avatar: null,
    role: 'member',
    ...overrides,
  };
}

const SINGLE_PERSON_COLUMN: Column = {
  id: 30,
  boardId: 1,
  name: 'Owner',
  columnType: 'person',
  config: {},
  position: 1,
  width: 200,
  isRequired: false,
};

const MULTI_PERSON_COLUMN: Column = {
  ...SINGLE_PERSON_COLUMN,
  config: { allow_multiple: true },
};

function resolveSearch(members: Member[]) {
  mockSearchMembers.mockResolvedValue({
    success: true,
    data: { members },
    pagination: { page: 1, limit: 50, total: members.length, totalPages: 1 },
  });
}

function renderEditor(props: {
  column?: Column;
  value: any;
  onChange?: (v: any) => void;
  onBlur?: () => void;
}) {
  const onChange = props.onChange ?? vi.fn();
  const onBlur = props.onBlur ?? vi.fn();
  return {
    onChange,
    onBlur,
    ...render(
      <ToastProvider>
        <ColumnEditor
          column={props.column ?? SINGLE_PERSON_COLUMN}
          value={props.value}
          onChange={onChange}
          onBlur={onBlur}
        />
      </ToastProvider>
    ),
  };
}

describe('ColumnEditor — person case (Slice 21B C1)', () => {
  beforeEach(() => {
    setWorkspace(7);
    mockSearchMembers.mockReset();
    resolveSearch([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts and fires searchMembers(workspaceId, "") after debounce — recents path', async () => {
    vi.useFakeTimers();
    const recents: Member[] = [
      makeMember({ id: 1, firstName: 'Alice', lastName: 'A' }),
      makeMember({ id: 2, firstName: 'Bob', lastName: 'B', email: 'bob@example.com' }),
    ];
    resolveSearch(recents);

    await act(async () => {
      renderEditor({ value: null });
    });

    // Debounce window: empty string -> debounced -> effect fires after 300ms.
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    // Flush pending microtasks for the resolved promise.
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSearchMembers).toHaveBeenCalledWith(
      7,
      '',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    // Switch to real timers so RTL's findBy* / waitFor can poll naturally.
    vi.useRealTimers();
    // Member rows render the name in a span — disambiguate from the
    // PersonAvatar `title=` attribute by searching for the row buttons.
    expect(
      await screen.findByRole('button', { name: /alice/i })
    ).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: /bob/i })
    ).toBeTruthy();
  });

  it('typing "alice" debounces 300ms then re-fetches with search="alice"', async () => {
    vi.useFakeTimers();
    resolveSearch([]);

    await act(async () => {
      renderEditor({ value: null });
    });

    // Initial empty-search effect fires after first debounce.
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });
    expect(mockSearchMembers).toHaveBeenLastCalledWith(
      7,
      '',
      expect.any(Object)
    );

    const input = screen.getByPlaceholderText(/search by name or email/i);

    // Type "alice" — input updates synchronously, but searchMembers must
    // NOT fire until 300ms after the last keystroke.
    await act(async () => {
      fireEvent.change(input, { target: { value: 'alice' } });
    });

    // Halfway through the debounce — no new call yet.
    await act(async () => {
      vi.advanceTimersByTime(150);
      await Promise.resolve();
    });
    // Still only the initial empty-search call.
    expect(mockSearchMembers).toHaveBeenCalledTimes(1);

    // Past the 300ms threshold — debounced effect fires.
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(mockSearchMembers).toHaveBeenCalledTimes(2);
    expect(mockSearchMembers).toHaveBeenLastCalledWith(
      7,
      'alice',
      expect.any(Object)
    );
  });

  it('single-assign click calls onChange(member) and closes via onBlur', async () => {
    const member = makeMember({
      id: 99,
      firstName: 'Carol',
      lastName: 'C',
      email: 'carol@example.com',
    });
    resolveSearch([member]);

    const onChange = vi.fn();
    const onBlur = vi.fn();
    await act(async () => {
      renderEditor({ value: null, onChange, onBlur });
    });

    // Wait for the picker to render the member row — uses real timers so
    // the 300ms debounce + microtask flush both naturally resolve.
    const row = await screen.findByRole('button', { name: /carol/i });
    await act(async () => {
      fireEvent.click(row);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(member);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('multi-assign click appends chip and DOES NOT close; X removes chip', async () => {
    const m1 = makeMember({ id: 1, firstName: 'Alice', lastName: 'A' });
    const m2 = makeMember({
      id: 2,
      firstName: 'Bob',
      lastName: 'B',
      email: 'bob@example.com',
    });
    resolveSearch([m1, m2]);

    const onChange = vi.fn();
    const onBlur = vi.fn();
    await act(async () => {
      renderEditor({
        column: MULTI_PERSON_COLUMN,
        value: [],
        onChange,
        onBlur,
      });
    });

    // Click Alice's row → onChange([alice]); picker stays open.
    const aliceRow = await screen.findByRole('button', { name: /alice/i });
    await act(async () => {
      fireEvent.click(aliceRow);
    });
    expect(onChange).toHaveBeenLastCalledWith([m1]);
    expect(onBlur).not.toHaveBeenCalled();

    // Re-render with the appended value — simulate parent state update.
    await act(async () => {
      renderEditor({
        column: MULTI_PERSON_COLUMN,
        value: [m1],
        onChange,
        onBlur,
      });
    });

    // Chip for Alice is now visible; X button removes her.
    const removeBtn = await screen.findByRole('button', {
      name: /remove alice/i,
    });
    await act(async () => {
      fireEvent.click(removeBtn);
    });
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(onBlur).not.toHaveBeenCalled();
  });

  it('multi-assign at cap (20) disables member buttons and emits a toast on click', async () => {
    // 20 already-assigned members — at the soft cap.
    const assigned: Member[] = Array.from({ length: 20 }, (_, i) =>
      makeMember({
        id: 100 + i,
        firstName: `User${i}`,
        lastName: 'X',
        email: `u${i}@example.com`,
      })
    );
    // Search response includes a 21st candidate not yet assigned.
    const candidate = makeMember({
      id: 999,
      firstName: 'Zeta',
      lastName: 'Z',
      email: 'zeta@example.com',
    });
    resolveSearch([candidate]);

    const onChange = vi.fn();
    await act(async () => {
      renderEditor({
        column: MULTI_PERSON_COLUMN,
        value: assigned,
        onChange,
      });
    });

    const candidateBtn = await screen.findByRole('button', { name: /zeta/i });

    // Per spec OQ #1: at cap, buttons are visually disabled. We use
    // `aria-disabled` (not native `disabled`) so the click still fires
    // and the handler can surface a toast — native `disabled` would
    // swallow the event and the user would get no feedback. The button
    // also carries the spec-mandated tooltip via `title=`.
    expect(candidateBtn.getAttribute('aria-disabled')).toBe('true');
    expect(candidateBtn.getAttribute('title')).toMatch(/maximum 20/i);

    // Click attempt — handler runs but short-circuits on the cap check;
    // onChange must NOT fire (no assignment past cap).
    await act(async () => {
      fireEvent.click(candidateBtn);
    });
    expect(onChange).not.toHaveBeenCalled();

    // Toast surfaces the cap message — assert via the rendered alert text.
    await waitFor(() => {
      expect(screen.getByText(/maximum 20 assignees/i)).toBeTruthy();
    });
  });
});
