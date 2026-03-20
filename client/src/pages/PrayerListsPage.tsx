import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PrayerList } from '@shared/prayer-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeader,
} from '@/components/ui';
import {
  createPrayerList,
  deletePrayerList,
  readPrayerLists,
  updatePrayerList,
} from '@/features/prayer-lists/prayer-lists-api';

export function PrayerListsPage() {
  const { showToast } = useToast();
  const [lists, setLists] = useState<PrayerList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [notPrayedRecentlyOnly, setNotPrayedRecentlyOnly] = useState(false);
  const [notPrayedDays, setNotPrayedDays] = useState('7');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'oldest'>('recent');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await readPrayerLists(includeArchived);
      setLists(rows);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lists');
    } finally {
      setIsLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  async function onCreateList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await createPrayerList({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      });
      setName('');
      setDescription('');
      await loadLists();
      showToast({ title: 'Prayer list created', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not create list',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onToggleArchived(list: PrayerList) {
    try {
      await updatePrayerList(list.listId, { isArchived: !list.isArchived });
      await loadLists();
      showToast({
        title: list.isArchived ? 'List restored' : 'List archived',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not update list',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onDeleteList(list: PrayerList) {
    if (!window.confirm(`Delete ${list.name}? This cannot be undone.`)) return;
    try {
      await deletePrayerList(list.listId);
      await loadLists();
      showToast({ title: 'List deleted', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not delete list',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  const filteredLists = useMemo(() => {
    const days = Math.max(1, Number(notPrayedDays) || 7);
    const nowMs = Date.now();
    const list = lists.filter((item) => {
      const notPrayedRecently =
        !item.lastSessionAt ||
        nowMs - new Date(item.lastSessionAt).getTime() >
          days * 24 * 60 * 60 * 1000;
      if (notPrayedRecentlyOnly && !notPrayedRecently) return false;
      return true;
    });
    return list.slice().sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'oldest') {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      const aRecent = Math.max(
        new Date(a.updatedAt).getTime(),
        a.lastSessionAt ? new Date(a.lastSessionAt).getTime() : 0,
      );
      const bRecent = Math.max(
        new Date(b.updatedAt).getTime(),
        b.lastSessionAt ? new Date(b.lastSessionAt).getTime() : 0,
      );
      return bRecent - aRecent;
    });
  }, [lists, notPrayedDays, notPrayedRecentlyOnly, sortBy]);

  return (
    <>
      <SectionHeader
        title="Prayer Lists"
        description="Create focused lists and group your prayer partners for intentional prayer sessions."
      />

      <Card className="mb-4 space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Create prayer list
        </h2>
        <form
          className="space-y-3"
          onSubmit={(event) => void onCreateList(event)}>
          <label className="block text-sm font-medium text-slate-700">
            List name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1"
              placeholder="Bible Study"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description (optional)
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="People in my Tuesday evening group..."
            />
          </label>
          <Button variant="primary" type="submit">
            Create list
          </Button>
        </form>
      </Card>

      <div className="mb-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Your lists</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => setIncludeArchived(event.target.checked)}
            />
            Show archived
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={notPrayedRecentlyOnly}
              onChange={(event) =>
                setNotPrayedRecentlyOnly(event.target.checked)
              }
            />
            Not prayed recently
          </label>
          <label className="block text-sm text-slate-700">
            Not prayed days
            <Input
              type="number"
              min={1}
              max={365}
              className="mt-1"
              value={notPrayedDays}
              onChange={(event) => setNotPrayedDays(event.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-700">
            Sort
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as 'recent' | 'name' | 'oldest')
              }>
              <option value="recent">Recent activity</option>
              <option value="name">Alphabetical</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading lists...</p>
      ) : null}

      {!isLoading && error ? (
        <EmptyState title="Could not load lists" description={error} />
      ) : null}

      {!isLoading && !error && filteredLists.length === 0 ? (
        <EmptyState
          title="No prayer lists match this filter"
          description="Try adjusting filters or create a new list above."
        />
      ) : null}

      {!isLoading && !error && filteredLists.length > 0 ? (
        <div className="space-y-3">
          {filteredLists.map((list) => (
            <Card key={list.listId} className="space-y-3 border p-4">
              <div>
                <p className="text-base font-semibold text-slate-800">
                  {list.name}
                  {list.isArchived ? ' (Archived)' : ''}
                </p>
                {list.description ? (
                  <p className="mt-1 text-sm text-slate-700">
                    {list.description}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  Sessions: {list.sessionCount ?? 0}
                  {list.lastSessionAt
                    ? ` · Last prayed ${new Date(list.lastSessionAt).toLocaleDateString()}`
                    : ' · Not prayed yet'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/prayer-lists/${list.listId}`}>
                  <Button variant="ghost">Open list</Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => void onToggleArchived(list)}>
                  {list.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button variant="ghost" onClick={() => void onDeleteList(list)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </>
  );
}
