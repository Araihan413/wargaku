export interface RoleItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface PermissionItem {
  id: number;
  slug: string;
  name: string;
  module: string;
  description: string | null;
}

export interface PermissionModuleGroup {
  module: string;
  permissions: PermissionItem[];
}

export interface RolePermissionMatrixData {
  roles: RoleItem[];
  permissions: PermissionItem[];
  moduleGroups: PermissionModuleGroup[];
  matrix: Record<number, number[]>;
}

export type MatrixState = Record<number, number[]>;
