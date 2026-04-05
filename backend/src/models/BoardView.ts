import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ViewType = 'table' | 'kanban' | 'calendar' | 'timeline' | 'dashboard' | 'map' | 'chart' | 'form';

export interface BoardViewAttributes {
  id: number;
  boardId: number;
  name: string;
  viewType: ViewType;
  settings: Record<string, unknown>;
  layoutJson: Record<string, unknown> | null;
  isDefault: boolean;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface BoardViewCreationAttributes
  extends Optional<BoardViewAttributes, 'id' | 'settings' | 'layoutJson' | 'isDefault' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class BoardView extends Model<BoardViewAttributes, BoardViewCreationAttributes> implements BoardViewAttributes {
  declare id: number;
  declare boardId: number;
  declare name: string;
  declare viewType: ViewType;
  declare settings: Record<string, unknown>;
  declare layoutJson: Record<string, unknown> | null;
  declare isDefault: boolean;
  declare createdBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

BoardView.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    boardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'board_id',
      references: {
        model: 'boards',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    viewType: {
      type: DataTypes.ENUM('table', 'kanban', 'calendar', 'timeline', 'dashboard', 'map', 'chart', 'form'),
      allowNull: false,
      field: 'view_type',
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    layoutJson: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'layout_json',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_default',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'board_views',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default BoardView;
