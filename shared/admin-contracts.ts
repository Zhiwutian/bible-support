export type UserRole = 'user' | 'admin';

export type AdminUserListItem = {
  userId: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuthEventListItem = {
  authAuditEventId: number;
  userId: string | null;
  provider: string;
  eventType:
    | 'login_start'
    | 'callback_success'
    | 'callback_failure'
    | 'logout'
    | 'admin_role_change';
  outcome: 'success' | 'failure';
  reason: string | null;
  message: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type AdminUsersResponse = {
  items: AdminUserListItem[];
  pagination: PaginationMeta;
};

export type AdminAuthEventsResponse = {
  items: AdminAuthEventListItem[];
  pagination: PaginationMeta;
};

export type UpdateUserRoleRequest = {
  role: UserRole;
  reason: string;
};

export type UpdateUserRoleResponse = {
  userId: string;
  role: UserRole;
};
