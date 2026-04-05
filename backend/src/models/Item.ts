import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ItemAttributes {
  id: number;
  boardId: number;
  groupId: number;
  name: string;
  position: number;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ItemCreationAttributes
  extends Optional<ItemAttributes, 'id' | 'position' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
  declare id: number;
  declare boardId: number;
  declare groupId: number;
  declare name: string;
  declare position: number;
  declare createdBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Item.init(
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
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'group_id',
      references: {
        model: 'board_groups',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: 'items',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Item;
