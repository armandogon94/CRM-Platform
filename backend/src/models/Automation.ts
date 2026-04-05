import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TriggerType =
  | 'on_item_created'
  | 'on_item_updated'
  | 'on_status_changed'
  | 'on_date_reached'
  | 'on_recurring';

export type ActionType =
  | 'send_email'
  | 'send_notification'
  | 'set_column_value'
  | 'create_subitem'
  | 'send_slack_message'
  | 'create_activity'
  | 'increment_number'
  | 'update_status';

export interface AutomationAttributes {
  id: number;
  boardId: number;
  name: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  actionType: ActionType;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AutomationCreationAttributes
  extends Optional<AutomationAttributes, 'id' | 'triggerConfig' | 'actionConfig' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Automation extends Model<AutomationAttributes, AutomationCreationAttributes> implements AutomationAttributes {
  declare id: number;
  declare boardId: number;
  declare name: string;
  declare triggerType: TriggerType;
  declare triggerConfig: Record<string, unknown>;
  declare actionType: ActionType;
  declare actionConfig: Record<string, unknown>;
  declare isActive: boolean;
  declare createdBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Automation.init(
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
    triggerType: {
      type: DataTypes.ENUM(
        'on_item_created',
        'on_item_updated',
        'on_status_changed',
        'on_date_reached',
        'on_recurring'
      ),
      allowNull: false,
      field: 'trigger_type',
    },
    triggerConfig: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'trigger_config',
    },
    actionType: {
      type: DataTypes.ENUM(
        'send_email',
        'send_notification',
        'set_column_value',
        'create_subitem',
        'send_slack_message',
        'create_activity',
        'increment_number',
        'update_status'
      ),
      allowNull: false,
      field: 'action_type',
    },
    actionConfig: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'action_config',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'automations',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Automation;
