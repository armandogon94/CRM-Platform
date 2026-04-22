import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface WorkspaceAttributes {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  settings: Record<string, unknown>;
  createdBy: number | null;
  isE2eFixture: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface WorkspaceCreationAttributes
  extends Optional<WorkspaceAttributes, 'id' | 'description' | 'settings' | 'createdBy' | 'isE2eFixture' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Workspace extends Model<WorkspaceAttributes, WorkspaceCreationAttributes> implements WorkspaceAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare settings: Record<string, unknown>;
  declare createdBy: number | null;
  declare isE2eFixture: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Workspace.init(
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
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
    isE2eFixture: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_e2e_fixture',
    },
  },
  {
    sequelize,
    tableName: 'workspaces',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Workspace;
