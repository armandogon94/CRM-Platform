import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type AutomationLogStatus = 'success' | 'failure' | 'skipped';

export interface AutomationLogAttributes {
  id: number;
  automationId: number;
  status: AutomationLogStatus;
  triggerData: Record<string, unknown>;
  actionResult: Record<string, unknown>;
  errorMessage: string | null;
  executedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AutomationLogCreationAttributes
  extends Optional<AutomationLogAttributes, 'id' | 'errorMessage' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class AutomationLog extends Model<AutomationLogAttributes, AutomationLogCreationAttributes> implements AutomationLogAttributes {
  declare id: number;
  declare automationId: number;
  declare status: AutomationLogStatus;
  declare triggerData: Record<string, unknown>;
  declare actionResult: Record<string, unknown>;
  declare errorMessage: string | null;
  declare executedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

AutomationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    automationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'automation_id',
      references: {
        model: 'automations',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'skipped'),
      allowNull: false,
    },
    triggerData: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'trigger_data',
    },
    actionResult: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'action_result',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'executed_at',
    },
  },
  {
    sequelize,
    tableName: 'automation_logs',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default AutomationLog;
