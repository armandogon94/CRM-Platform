/**
 * E2EResetService — Slice 19, Task A3.
 *
 * Single source of truth for wiping and re-seeding the dedicated E2E
 * fixture workspace. Callable from:
 *   (1) the HTTP route POST /api/v1/admin/e2e/reset  (Task A4)
 *   (2) the CLI script npm run reset:e2e              (Task A5)
 *
 * Both paths must produce identical side effects, so the logic lives
 * here and each adapter is a thin wrapper.
 *
 * Safety: the service targets only the workspace row flagged
 * `is_e2e_fixture = true`. Dev and production workspaces are never
 * touched. A transaction wraps the whole flow so a failed destroy or
 * reseed leaves the fixture in its previous consistent state.
 */

import type { Transaction } from 'sequelize';
import {
  sequelize,
  Workspace,
  Board,
  BoardGroup,
  Column,
  Item,
  ColumnValue,
  BoardView,
  Automation,
  AutomationLog,
  ActivityLog,
  Notification,
  FileAttachment,
} from '../models';
import { logger } from '../utils/logger';

/**
 * Populate the fixture workspace after cascade-delete. Injected so the
 * NovaPay seeder module can be wired by Task B1/B2 without creating an
 * import cycle between services/ and seeds/.
 */
export type E2EResetReseed = (workspaceId: number, tx: Transaction) => Promise<void>;

export interface E2EResetOptions {
  reseed?: E2EResetReseed;
}

export interface E2EResetResult {
  workspaceId: number;
}

export class E2EResetService {
  private readonly defaultReseed: E2EResetReseed = async (workspaceId) => {
    logger.warn(
      `E2EResetService.reset: no reseed function provided; fixture workspace ${workspaceId} was cleared but not re-populated (wire in Task B1/B2)`
    );
  };

  /**
   * Wipe and re-seed the fixture workspace. Returns the workspace id on
   * success, or `null` when no fixture workspace exists (first-boot case
   * before seeds run).
   *
   * Throws only if the reseed callback throws or the database is
   * unavailable — either case rolls the transaction back.
   */
  async reset(options: E2EResetOptions = {}): Promise<E2EResetResult | null> {
    const reseed = options.reseed ?? this.defaultReseed;

    return sequelize.transaction(async (tx) => {
      const fixture = await Workspace.findOne({
        where: { isE2eFixture: true },
        transaction: tx,
      });
      if (!fixture) return null;

      const workspaceId = fixture.id;

      // Collect ids once; every downstream destroy narrows to these so
      // non-fixture data in the same tables is untouched.
      const boards = await Board.findAll({
        where: { workspaceId },
        attributes: ['id'],
        transaction: tx,
      });
      const boardIds = boards.map((b) => b.id);

      const items = boardIds.length
        ? await Item.findAll({
            where: { boardId: boardIds },
            attributes: ['id'],
            transaction: tx,
          })
        : [];
      const itemIds = items.map((i) => i.id);

      const automations = boardIds.length
        ? await Automation.findAll({
            where: { boardId: boardIds },
            attributes: ['id'],
            transaction: tx,
          })
        : [];
      const automationIds = automations.map((a) => a.id);

      // ─── Leaves-first destroy order ───────────────────────────────
      // Level 1: children of Item / Automation
      if (itemIds.length) {
        await ColumnValue.destroy({
          where: { itemId: itemIds },
          transaction: tx,
          force: true,
        });
      }
      if (automationIds.length) {
        await AutomationLog.destroy({
          where: { automationId: automationIds },
          transaction: tx,
          force: true,
        });
      }

      // Level 2: children of Board (all FK to board_id)
      if (boardIds.length) {
        await Item.destroy({ where: { boardId: boardIds }, transaction: tx, force: true });
        await BoardView.destroy({ where: { boardId: boardIds }, transaction: tx, force: true });
        await BoardGroup.destroy({ where: { boardId: boardIds }, transaction: tx, force: true });
        await Column.destroy({ where: { boardId: boardIds }, transaction: tx, force: true });
        await Automation.destroy({ where: { boardId: boardIds }, transaction: tx, force: true });
      }

      // Level 3: workspace-scoped (Board + standalone workspace children)
      await Board.destroy({ where: { workspaceId }, transaction: tx, force: true });
      await Notification.destroy({ where: { workspaceId }, transaction: tx, force: true });
      await ActivityLog.destroy({ where: { workspaceId }, transaction: tx, force: true });
      await FileAttachment.destroy({ where: { workspaceId }, transaction: tx, force: true });

      // ─── Re-seed ──────────────────────────────────────────────────
      await reseed(workspaceId, tx);

      return { workspaceId };
    });
  }
}

export default new E2EResetService();
