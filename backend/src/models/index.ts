import sequelize from '../config/database';

import Workspace from './Workspace';
import User from './User';
import Board from './Board';
import BoardGroup from './BoardGroup';
import Column from './Column';
import Item from './Item';
import ColumnValue from './ColumnValue';
import BoardView from './BoardView';
import Automation from './Automation';
import AutomationLog from './AutomationLog';
import ActivityLog from './ActivityLog';
import Notification from './Notification';
import FileAttachment from './FileAttachment';

// ─── Workspace <-> User ─────────────────────────────────────────────────────
Workspace.hasMany(User, { foreignKey: 'workspace_id', as: 'users' });
User.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// ─── Workspace <-> Board ────────────────────────────────────────────────────
Workspace.hasMany(Board, { foreignKey: 'workspace_id', as: 'boards' });
Board.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// ─── Board <-> User (creator) ───────────────────────────────────────────────
Board.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ─── Board <-> BoardGroup ───────────────────────────────────────────────────
Board.hasMany(BoardGroup, { foreignKey: 'board_id', as: 'groups' });
BoardGroup.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// ─── Board <-> Column ──────────────────────────────────────────────────────
Board.hasMany(Column, { foreignKey: 'board_id', as: 'columns' });
Column.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// ─── Board <-> Item ────────────────────────────────────────────────────────
Board.hasMany(Item, { foreignKey: 'board_id', as: 'items' });
Item.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// ─── BoardGroup <-> Item ───────────────────────────────────────────────────
BoardGroup.hasMany(Item, { foreignKey: 'group_id', as: 'items' });
Item.belongsTo(BoardGroup, { foreignKey: 'group_id', as: 'group' });

// ─── Item <-> User (creator) ───────────────────────────────────────────────
Item.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ─── Item <-> ColumnValue ──────────────────────────────────────────────────
Item.hasMany(ColumnValue, { foreignKey: 'item_id', as: 'columnValues' });
ColumnValue.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

// ─── Column <-> ColumnValue ────────────────────────────────────────────────
Column.hasMany(ColumnValue, { foreignKey: 'column_id', as: 'columnValues' });
ColumnValue.belongsTo(Column, { foreignKey: 'column_id', as: 'column' });

// ─── Board <-> BoardView ──────────────────────────────────────────────────
Board.hasMany(BoardView, { foreignKey: 'board_id', as: 'views' });
BoardView.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// ─── Board <-> Automation ──────────────────────────────────────────────────
Board.hasMany(Automation, { foreignKey: 'board_id', as: 'automations' });
Automation.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// ─── Automation <-> AutomationLog ──────────────────────────────────────────
Automation.hasMany(AutomationLog, { foreignKey: 'automation_id', as: 'logs' });
AutomationLog.belongsTo(Automation, { foreignKey: 'automation_id', as: 'automation' });

export {
  sequelize,
  Workspace,
  User,
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
};

export default {
  sequelize,
  Workspace,
  User,
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
};
