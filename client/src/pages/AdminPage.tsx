import { useEffect, useMemo, useState } from 'react';
import type {
  AdminAuthEventListItem,
  AdminUserListItem,
} from '@shared/admin-contracts';
import {
  readAdminAuthEvents,
  readAdminUsers,
  updateAdminUserRole,
} from '@/features/admin/admin-api';
function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Request did not complete. Please try again.';
}

type Props = {
  authUserId: string;
};

const PAGE_SIZE = 20;

/** Minimal admin console for user role management and audit event visibility. */
export function AdminPage({ authUserId }: Props) {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [events, setEvents] = useState<AdminAuthEventListItem[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [usersErrorMessage, setUsersErrorMessage] = useState<string | null>(
    null,
  );
  const [eventsErrorMessage, setEventsErrorMessage] = useState<string | null>(
    null,
  );
  const [roleReasonByUser, setRoleReasonByUser] = useState<
    Record<string, string>
  >({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingUsers(true);
    setUsersErrorMessage(null);
    readAdminUsers({ page: usersPage, pageSize: PAGE_SIZE })
      .then((payload) => {
        setUsers(payload.items);
        setUsersTotal(payload.pagination.total);
      })
      .catch((error) => setUsersErrorMessage(errorToMessage(error)))
      .finally(() => setIsLoadingUsers(false));
  }, [usersPage]);

  useEffect(() => {
    setIsLoadingEvents(true);
    setEventsErrorMessage(null);
    readAdminAuthEvents({ page: eventsPage, pageSize: PAGE_SIZE })
      .then((payload) => {
        setEvents(payload.items);
        setEventsTotal(payload.pagination.total);
      })
      .catch((error) => setEventsErrorMessage(errorToMessage(error)))
      .finally(() => setIsLoadingEvents(false));
  }, [eventsPage]);

  const usersPageCount = useMemo(
    () => Math.max(1, Math.ceil(usersTotal / PAGE_SIZE)),
    [usersTotal],
  );
  const eventsPageCount = useMemo(
    () => Math.max(1, Math.ceil(eventsTotal / PAGE_SIZE)),
    [eventsTotal],
  );

  async function handleRoleChange(
    targetUserId: string,
    nextRole: 'user' | 'admin',
  ): Promise<void> {
    const reason = (roleReasonByUser[targetUserId] ?? '').trim();
    if (!reason) {
      setUsersErrorMessage('Please add a brief reason before updating a role.');
      return;
    }
    setPendingUserId(targetUserId);
    setUsersErrorMessage(null);
    try {
      await updateAdminUserRole(targetUserId, { role: nextRole, reason });
      setRoleReasonByUser((prev) => ({ ...prev, [targetUserId]: '' }));
      const payload = await readAdminUsers({
        page: usersPage,
        pageSize: PAGE_SIZE,
      });
      setUsers(payload.items);
      setUsersTotal(payload.pagination.total);
      const eventsPayload = await readAdminAuthEvents({
        page: eventsPage,
        pageSize: PAGE_SIZE,
      });
      setEvents(eventsPayload.items);
      setEventsTotal(eventsPayload.pagination.total);
    } catch (error) {
      setUsersErrorMessage(errorToMessage(error));
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-slate-600">
          Manage user roles and review recent sign-in activity.
        </p>
      </header>

      {usersErrorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {usersErrorMessage}
        </p>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Users</h2>
        {isLoadingUsers ? (
          <p className="mt-3 text-sm text-slate-600">Loading user list...</p>
        ) : (
          <div className="mt-3 space-y-3">
            {users.map((user) => (
              <article
                key={user.userId}
                className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {user.displayName || 'Unnamed user'}
                    </p>
                    <p className="text-xs text-slate-500">{user.userId}</p>
                    <p className="text-xs text-slate-500">Role: {user.role}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="min-h-10 w-56 rounded-md border border-slate-300 px-2 text-sm"
                      value={roleReasonByUser[user.userId] ?? ''}
                      onChange={(event) =>
                        setRoleReasonByUser((prev) => ({
                          ...prev,
                          [user.userId]: event.target.value,
                        }))
                      }
                      placeholder="Reason for role change"
                    />
                    <select
                      className="min-h-10 rounded-md border border-slate-300 px-2 text-sm"
                      value={user.role}
                      disabled={pendingUserId === user.userId}
                      onChange={(event) =>
                        void handleRoleChange(
                          user.userId,
                          event.target.value as 'user' | 'admin',
                        )
                      }>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                {user.userId === authUserId ? (
                  <p className="mt-2 text-xs text-amber-700">
                    This is your account.
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={usersPage <= 1}
            onClick={() => setUsersPage((page) => Math.max(1, page - 1))}>
            Previous
          </button>
          <span>
            Page {usersPage} of {usersPageCount}
          </span>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={usersPage >= usersPageCount}
            onClick={() =>
              setUsersPage((page) => Math.min(usersPageCount, page + 1))
            }>
            Next
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Recent auth events</h2>
        {eventsErrorMessage ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {eventsErrorMessage}
          </p>
        ) : null}
        {isLoadingEvents ? (
          <p className="mt-3 text-sm text-slate-600">
            Loading sign-in events...
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {events.map((event) => (
              <li
                key={event.authAuditEventId}
                className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-medium">
                  {event.eventType} - {event.outcome}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
                {event.reason ? (
                  <p className="text-xs text-slate-600">
                    Reason: {event.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={eventsPage <= 1}
            onClick={() => setEventsPage((page) => Math.max(1, page - 1))}>
            Previous
          </button>
          <span>
            Page {eventsPage} of {eventsPageCount}
          </span>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={eventsPage >= eventsPageCount}
            onClick={() =>
              setEventsPage((page) => Math.min(eventsPageCount, page + 1))
            }>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
