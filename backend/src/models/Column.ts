import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ColumnType =
  | 'status'
  | 'text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'person'
  | 'email'
  | 'phone'
  | 'dropdown'
  | 'checkbox'
  | 'url'
  | 'files'
  | 'formula'
  | 'timeline'
  | 'rating';

export interface ColumnAttributes {
  id: number;
  boardId: number;
  name: string;
  columnType: ColumnType;
  config: Record<string, unknown>;
  position: number;
  width: number;
  isRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ColumnCreationAttributes
  extends Optional<ColumnAttributes, 'id' | 'config' | 'position' | 'width' | 'isRequired' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Column extends Model<ColumnAttributes, ColumnCreationAttributes> implements ColumnAttributes {
  declare id: number;
  declare boardId: number;
  declare name: string;
  declare columnType: ColumnType;
  declare config: Record<string, unknown>;
  declare position: number;
  declare width: number;
  declare isRequired: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Column.init(
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
    columnType: {
      type: DataTypes.ENUM(
        'status',
        'text',
        'long_text',
        'number',
        'date',
        'person',
        'email',
        'phone',
        'dropdown',
        'checkbox',
        'url',
        'files',
        'formula',
        'timeline',
        'rating'
      ),
      allowNull: false,
      field: 'column_type',
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    width: {
      type: DataTypes.INTEGER,
      defaultValue: 150,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_required',
    },
  },
  {
    sequelize,
    tableName: 'column_definitions',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Column;
