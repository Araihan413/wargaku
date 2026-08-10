export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  status: "pending" | "active" | "suspended";
  roleId: number;
  roleIds?: number[];
  roleName: string;
  roleSlug: string;
  createdAt: string;
}

export interface RoleItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface PaginationMetadata {
  total: number;
  limit: number;
  offset: number;
}
