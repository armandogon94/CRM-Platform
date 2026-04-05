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
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  brandColor: string;
  secondaryColor: string;
  accentColor: string;
  industry: string;
  tagline: string;
  logo: string;
}

export interface Board {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  boardType: 'main' | 'shareable' | 'private';
  isTemplate: boolean;
  settings: Record<string, unknown>;
  groups?: BoardGroup[];
  columns?: Column[];
  views?: BoardView[];
  items?: Item[];
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

export interface BoardView {
  id: number;
  boardId: number;
  name: string;
  viewType: 'table' | 'kanban' | 'calendar' | 'timeline' | 'dashboard' | 'map' | 'chart' | 'form';
  settings: Record<string, unknown>;
  isDefault: boolean;
}

export interface Column {
  id: number;
  boardId: number;
  name: string;
  columnType: ColumnType;
  config: Record<string, unknown>;
  position: number;
  width: number;
  isRequired: boolean;
}

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

export interface Item {
  id: number;
  boardId: number;
  groupId: number;
  name: string;
  position: number;
  columnValues?: ColumnValue[];
}

export interface ColumnValue {
  id: number;
  itemId: number;
  columnId: number;
  value: unknown;
}

export interface Automation {
  id: number;
  boardId: number;
  name: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
}

export interface ApiResponse<T = unknown> {
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

export interface StatusOption {
  label: string;
  color: string;
  order: number;
}

export interface DropdownOption {
  id: string;
  label: string;
  color: string;
  order: number;
}
