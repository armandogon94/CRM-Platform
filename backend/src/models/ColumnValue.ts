import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ColumnValueAttributes {
  id: number;
  itemId: number;
  columnId: number;
  value: unknown | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ColumnValueCreationAttributes
  extends Optional<ColumnValueAttributes, 'id' | 'value' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class ColumnValue extends Model<ColumnValueAttributes, ColumnValueCreationAttributes> implements ColumnValueAttributes {
  declare id: number;
  declare itemId: number;
  declare columnId: number;
  declare value: unknown | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

ColumnValue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'item_id',
      references: {
        model: 'items',
        key: 'id',
      },
    },
    columnId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'column_id',
      references: {
        model: 'column_definitions',
        key: 'id',
      },
    },
    value: {
      type: DataTypes.JSONB,
      defaultValue: null,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'column_values',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['item_id', 'column_id'],
        name: 'column_values_item_id_column_id_unique',
      },
    ],
  }
);

export default ColumnValue;
