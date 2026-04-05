import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface FileAttachmentAttributes {
  id: number;
  itemId: number | null;
  columnValueId: number | null;
  workspaceId: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface FileAttachmentCreationAttributes
  extends Optional<FileAttachmentAttributes, 'id' | 'itemId' | 'columnValueId' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class FileAttachment extends Model<FileAttachmentAttributes, FileAttachmentCreationAttributes> implements FileAttachmentAttributes {
  declare id: number;
  declare itemId: number | null;
  declare columnValueId: number | null;
  declare workspaceId: number;
  declare fileName: string;
  declare originalName: string;
  declare mimeType: string;
  declare fileSize: number;
  declare filePath: string;
  declare uploadedBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

FileAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'item_id',
      references: {
        model: 'items',
        key: 'id',
      },
    },
    columnValueId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'column_value_id',
      references: {
        model: 'column_values',
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
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name',
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'original_name',
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'mime_type',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'file_size',
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path',
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploaded_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'file_attachments',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default FileAttachment;
