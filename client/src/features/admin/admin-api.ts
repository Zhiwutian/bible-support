import type {
  AdminAuthEventsResponse,
  AdminUsersResponse,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
} from '@shared/admin-contracts';
import { fetchJson } from '@/lib';

function buildPaginatedPath(
  path: string,
  page: number,
  pageSize: number,
): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return `${path}?${params.toString()}`;
}

/** Fetch paginated admin users list. */
export async function readAdminUsers(input: {
  page: number;
  pageSize: number;
}): Promise<AdminUsersResponse> {
  return fetchJson<AdminUsersResponse>(
    buildPaginatedPath('/api/admin/users', input.page, input.pageSize),
  );
}

/** Fetch paginated auth audit events list. */
export async function readAdminAuthEvents(input: {
  page: number;
  pageSize: number;
}): Promise<AdminAuthEventsResponse> {
  return fetchJson<AdminAuthEventsResponse>(
    buildPaginatedPath('/api/admin/auth-events', input.page, input.pageSize),
  );
}

/** Update role for one user with explicit reason. */
export async function updateAdminUserRole(
  userId: string,
  payload: UpdateUserRoleRequest,
): Promise<UpdateUserRoleResponse> {
  return fetchJson<UpdateUserRoleResponse>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
