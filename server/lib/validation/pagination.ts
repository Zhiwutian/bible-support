import { z } from 'zod';

/** Default page size for admin list endpoints. */
export const ADMIN_PAGINATION_DEFAULT_PAGE_SIZE = 20;

/** Maximum page size after normalization (admin list endpoints). */
export const ADMIN_PAGINATION_MAX_PAGE_SIZE = 100;

/**
 * Query params for `GET /api/admin/users` and `GET /api/admin/auth-events`.
 * Coerces string query values to positive integers.
 */
export const adminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .default(ADMIN_PAGINATION_DEFAULT_PAGE_SIZE),
});

export type AdminPaginationQuery = z.infer<typeof adminPaginationQuerySchema>;

/** Clamp admin list `pageSize` to a safe upper bound. */
export function normalizeAdminPaginationQuery(query: AdminPaginationQuery): {
  page: number;
  pageSize: number;
} {
  return {
    page: query.page,
    pageSize: Math.min(ADMIN_PAGINATION_MAX_PAGE_SIZE, query.pageSize),
  };
}
