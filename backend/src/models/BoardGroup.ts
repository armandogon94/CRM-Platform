import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface BoardGroupAttributes {
  id: number;
  boardId: number;
  name: string;
  color: string;
  position: number;
  isCollapsed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface BoardGroupCreationAttributes
  extends Optional<BoardGroupAttributes, 'id' | 'color' | 'position' | 'isCollapsed' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class BoardGroup extends Model<BoardGroupAttributes, BoardGroupCreationAttributes> implements BoardGroupAttributes {
  declare id: number;
  declare boardId: number;
  declare name: string;
  declare color: string;
  declare position: number;
  declare isCollapsed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

BoardGroup.init(
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
    color: {
      type: DataTypes.STRING,
      defaultValue: '#579BFC',
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isCollapsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_collapsed',
    },
  },
  {
    sequelize,
    tableName: 'board_groups',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default BoardGroup;
