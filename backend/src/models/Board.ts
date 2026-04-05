import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type BoardType = 'main' | 'shareable' | 'private';

export interface BoardAttributes {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  createdBy: number;
  boardType: BoardType;
  isTemplate: boolean;
  settings: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface BoardCreationAttributes
  extends Optional<BoardAttributes, 'id' | 'description' | 'boardType' | 'isTemplate' | 'settings' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Board extends Model<BoardAttributes, BoardCreationAttributes> implements BoardAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare workspaceId: number;
  declare createdBy: number;
  declare boardType: BoardType;
  declare isTemplate: boolean;
  declare settings: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Board.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'workspace_id',
      references: {
        model: 'workspaces',
        key: 'id',
      },
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
    boardType: {
      type: DataTypes.ENUM('main', 'shareable', 'private'),
      defaultValue: 'main',
      field: 'board_type',
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_template',
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'boards',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Board;
