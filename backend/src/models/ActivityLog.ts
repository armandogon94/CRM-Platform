import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ActivityLogAttributes {
  id: number;
  workspaceId: number;
  userId: number;
  entityType: string;
  entityId: number;
  action: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActivityLogCreationAttributes
  extends Optional<ActivityLogAttributes, 'id' | 'changes' | 'ipAddress' | 'createdAt' | 'updatedAt'> {}

class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  declare id: number;
  declare workspaceId: number;
  declare userId: number;
  declare entityType: string;
  declare entityId: number;
  declare action: string;
  declare changes: Record<string, unknown> | null;
  declare ipAddress: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'entity_id',
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address',
    },
  },
  {
    sequelize,
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

export default ActivityLog;
