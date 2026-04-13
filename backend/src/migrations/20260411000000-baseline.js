'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── workspaces ─────────────────────────────────────────────
    await queryInterface.createTable('workspaces', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      settings: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── users ──────────────────────────────────────────────────
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      first_name: { type: Sequelize.STRING, allowNull: false },
      last_name: { type: Sequelize.STRING, allowNull: false },
      avatar: { type: Sequelize.STRING, allowNull: true },
      workspace_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'workspaces', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      role: { type: Sequelize.ENUM('admin', 'member', 'viewer'), allowNull: false, defaultValue: 'member' },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── boards ─────────────────────────────────────────────────
    await queryInterface.createTable('boards', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      workspace_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      board_type: { type: Sequelize.ENUM('main', 'shareable', 'private'), allowNull: false, defaultValue: 'main' },
      is_template: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      settings: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── board_groups ───────────────────────────────────────────
    await queryInterface.createTable('board_groups', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      board_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      color: { type: Sequelize.STRING, allowNull: true, defaultValue: '#579BFC' },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_collapsed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── board_views ────────────────────────────────────────────
    await queryInterface.createTable('board_views', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      board_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      view_type: {
        type: Sequelize.ENUM('table', 'kanban', 'calendar', 'timeline', 'dashboard', 'map', 'chart', 'form'),
        allowNull: false,
      },
      settings: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      layout_json: { type: Sequelize.JSONB, allowNull: true },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── column_definitions ─────────────────────────────────────
    await queryInterface.createTable('column_definitions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      board_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      column_type: {
        type: Sequelize.ENUM(
          'status', 'text', 'long_text', 'number', 'date', 'person',
          'email', 'phone', 'dropdown', 'checkbox', 'url', 'files',
          'formula', 'timeline', 'rating'
        ),
        allowNull: false,
      },
      config: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      width: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 150 },
      is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── items ──────────────────────────────────────────────────
    await queryInterface.createTable('items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      board_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      group_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'board_groups', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── column_values ──────────────────────────────────────────
    await queryInterface.createTable('column_values', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      item_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      column_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'column_definitions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      value: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('column_values', ['item_id', 'column_id'], {
      unique: true,
      name: 'column_values_item_id_column_id_unique',
    });

    // ─── file_attachments ───────────────────────────────────────
    await queryInterface.createTable('file_attachments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      item_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      column_value_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'column_values', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      workspace_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      file_name: { type: Sequelize.STRING, allowNull: false },
      original_name: { type: Sequelize.STRING, allowNull: false },
      mime_type: { type: Sequelize.STRING, allowNull: false },
      file_size: { type: Sequelize.INTEGER, allowNull: false },
      file_path: { type: Sequelize.STRING, allowNull: false },
      uploaded_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── automations ────────────────────────────────────────────
    await queryInterface.createTable('automations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      board_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      trigger_type: {
        type: Sequelize.ENUM('on_item_created', 'on_item_updated', 'on_status_changed', 'on_date_reached', 'on_recurring'),
        allowNull: false,
      },
      trigger_config: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      action_type: {
        type: Sequelize.ENUM(
          'send_email', 'send_notification', 'set_column_value', 'create_subitem',
          'send_slack_message', 'create_activity', 'increment_number', 'update_status'
        ),
        allowNull: false,
      },
      action_config: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── automation_logs ────────────────────────────────────────
    await queryInterface.createTable('automation_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      automation_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'automations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('success', 'failure', 'skipped'),
        allowNull: false,
      },
      trigger_data: { type: Sequelize.JSONB, allowNull: false },
      action_result: { type: Sequelize.JSONB, allowNull: false },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      executed_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    // ─── activity_logs ──────────────────────────────────────────
    await queryInterface.createTable('activity_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      workspace_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      entity_type: { type: Sequelize.STRING, allowNull: false },
      entity_id: { type: Sequelize.INTEGER, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      changes: { type: Sequelize.JSONB, allowNull: true },
      ip_address: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // ─── notifications ──────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      workspace_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: true },
      type: { type: Sequelize.ENUM('info', 'success', 'warning', 'error'), allowNull: false, defaultValue: 'info' },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      link_url: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    // Drop in reverse dependency order
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('automation_logs');
    await queryInterface.dropTable('automations');
    await queryInterface.dropTable('file_attachments');
    await queryInterface.dropTable('column_values');
    await queryInterface.dropTable('items');
    await queryInterface.dropTable('column_definitions');
    await queryInterface.dropTable('board_views');
    await queryInterface.dropTable('board_groups');
    await queryInterface.dropTable('boards');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('workspaces');
  },
};
