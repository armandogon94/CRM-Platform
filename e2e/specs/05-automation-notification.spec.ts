import { test, expect } from '../fixtures/test';

/**
 * Slice 19 — Flow 5: Automation triggers notification.
 *
 * Backend contract (Slice 19 B2, see
 * `backend/src/seeds/novapay/automations.ts#seedNovaPayE2eFlaggedAutomation`):
 *   - Fixture workspace `novapay-e2e` owns a board named "Transaction
 *     Pipeline" with a Status column whose options are
 *     [ New, In Progress, Flagged, Resolved ].
 *   - An `on_status_changed` automation fires when `toStatus === 'Flagged'`
 *     on that board's Status column. Action: `send_notification` to the
 *     E2E user (title "Item flagged").
 *   - `AutomationEngine` creates a `Notification` row and
 *     `NotificationService.create` emits `notification:created` over
 *     Socket.io to the user's room. The UI `NotificationBell` subscribes
 *     to that event and increments its unread badge — no poll / reload
 *     needed for the count to update.
 *
 * Selector discipline (SPEC §Slice 19):
 *   - Role-first locators; `data-testid` only where role + accessible
 *     name are insufficient. The NotificationBell already exposes
 *     `notification-bell`, `unread-badge`, `notification-panel`, and
 *     `notification-item-<id>` testids, so no frontend edits are
 *     required by this spec.
 *   - Asynchronous assertions use `expect.poll()` with a bounded
 *     timeout — `page.waitForTimeout()` is forbidden.
 */

const NOTIFICATION_TIMEOUT_MS = 3_000;
const ITEM_NAME = `E2E Flow 5 Item ${Date.now()}`;

test.describe('Flow 5 — automation triggers in-app notification', () => {
  test('Status → Flagged emits notification within 3s and surfaces in the bell dropdown', async ({
    page,
    a11yScan,
  }) => {
    // 1. Open the fixture "Transaction Pipeline" board (Flow 1 path).
    await page.goto('/');
    await page.waitForURL(/\/boards(\/|$|\?)/, { timeout: 15_000 });
    await page
      .getByRole('button', { name: /Transaction Pipeline/ })
      .click();
    await page.waitForURL(/\/boards\/\d+(?:\/|$|\?)/, { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { level: 1, name: 'Transaction Pipeline' })
    ).toBeVisible();

    // A11y audit — BoardPage fully rendered before we drive the
    // automation. Scanning now (rather than after the notification
    // toast opens) keeps the assertion focused on the stable board
    // shell; the popover itself is transient and has its own mount
    // proof via the unread-badge poll below. Slice 19 E2.
    await a11yScan();

    // 2. Pre-condition: create a fresh item with Status set to a NON-Flagged
    //    value. We set it to "In Progress" so the subsequent transition to
    //    "Flagged" crosses a real state boundary — mirrors a user escalating
    //    a transaction from active → flagged.
    const addItemInput = page.getByPlaceholder('+ Add item');
    await addItemInput.fill(ITEM_NAME);
    await addItemInput.press('Enter');

    const itemRow = page.getByRole('row', { name: new RegExp(ITEM_NAME) });
    await expect(itemRow).toBeVisible();

    const statusCell = itemRow.getByRole('cell').nth(1);
    await statusCell.click();
    await page.getByRole('button', { name: 'In Progress' }).click();
    await expect(statusCell.getByText('In Progress')).toBeVisible();

    // 3. Read the starting unread count. On a fresh fixture reset this is
    //    typically 0 (no badge rendered) but we capture the actual value
    //    so the assertion stays correct if the fixture evolves.
    const bell = page.getByTestId('notification-bell');
    await expect(bell).toBeVisible();

    const startingCount = await readUnreadCount(page);

    // 4. Change Status → Flagged via the UI (same picker pattern).
    await statusCell.click();
    await page.getByRole('button', { name: 'Flagged' }).click();

    // 5. expect.poll with a 3s ceiling — the badge must reach
    //    `startingCount + 1` once the automation fires and the
    //    `notification:created` WS frame lands on this client.
    await expect
      .poll(() => readUnreadCount(page), {
        timeout: NOTIFICATION_TIMEOUT_MS,
        message: `notification badge did not reach ${startingCount + 1} within ${NOTIFICATION_TIMEOUT_MS}ms`,
      })
      .toBe(startingCount + 1);

    // 6. Open the dropdown and assert the new notification surfaces.
    //    The seed uses title "Item flagged" (see B2) — we accept any
    //    entry mentioning "flag" so small copy tweaks don't break the
    //    spec while still proving the right automation fired.
    await bell.click();
    const panel = page.getByTestId('notification-panel');
    await expect(panel).toBeVisible();
    await expect(
      panel.getByText(/flag/i).first()
    ).toBeVisible();

    // 7. Within-run cleanup — mark the fresh notification read so repeated
    //    invocations within a single suite run do not accumulate unread
    //    state before globalSetup's next reset wipes the workspace. The
    //    button only renders when `unreadCount > 0`, which is guaranteed
    //    by the poll above.
    await page
      .getByTestId('mark-all-read')
      .click();
    await expect(page.getByTestId('unread-badge')).toHaveCount(0);
  });
});

/**
 * Reads the NotificationBell's unread badge count. Returns 0 when the
 * badge is absent — that is the intentional UI state for "0 unread" and
 * must not be interpreted as a missing-element failure.
 */
async function readUnreadCount(
  page: import('@playwright/test').Page
): Promise<number> {
  const badge = page.getByTestId('unread-badge');
  if ((await badge.count()) === 0) return 0;
  const text = (await badge.textContent())?.trim() ?? '';
  if (text === '' || text === '99+') {
    // Empty text = transient render; treat as 0 so the poll keeps trying.
    // "99+" should never occur on a freshly reset fixture, but treat the
    // cap as a sentinel high value rather than NaN so the poll fails with
    // a meaningful diff.
    return text === '99+' ? 99 : 0;
  }
  const parsed = Number.parseInt(text, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
