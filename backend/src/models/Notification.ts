import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAttributes {
  id: number;
  userId: number;
  workspaceId: number;
  title: string;
  message: string | null;
  type: NotificationType;
  isRead: boolean;
  linkUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'message' | 'type' | 'isRead' | 'linkUrl' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare userId: number;
  declare workspaceId: number;
  declare title: string;
  declare message: string | null;
  declare type: NotificationType;
  declare isRead: boolean;
  declare linkUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'workspace_id',
      references: {
        model: 'workspaces',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
      defaultValue: 'info',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    linkUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'link_url',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Notification;
