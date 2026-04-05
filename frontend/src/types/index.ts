export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: 'admin' | 'member' | 'viewer';
  workspaceId: number;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Board {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  boardType: string;
  groups: BoardGroup[];
  columns: Column[];
  views: BoardView[];
}

export interface BoardGroup {
  id: number;
  boardId: number;
  name: string;
  color: string;
  position: number;
  isCollapsed: boolean;
  items?: Item[];
}

export interface Column {
  id: number;
  boardId: number;
  name: string;
  columnType: string;
  config: Record<string, any>;
  position: number;
  width: number;
  isRequired: boolean;
}

export interface Item {
  id: number;
  boardId: number;
  groupId: number;
  name: string;
  position: number;
  createdBy: number;
  columnValues: ColumnValue[];
}

export interface ColumnValue {
  id: number;
  itemId: number;
  columnId: number;
  value: any;
}

export interface BoardView {
  id: number;
  boardId: number;
  name: string;
  viewType: 'table' | 'kanban' | 'calendar' | 'timeline' | 'dashboard' | 'map' | 'chart' | 'form';
  settings: Record<string, any>;
  layoutJson: Record<string, any> | null;
  isDefault: boolean;
}

export interface Automation {
  id: number;
  boardId: number;
  name: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  actionType: string;
  actionConfig: Record<string, any>;
  isActive: boolean;
  createdBy: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
