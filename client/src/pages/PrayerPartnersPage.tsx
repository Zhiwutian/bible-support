import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PrayerPartner } from '@shared/prayer-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeader,
} from '@/components/ui';
import {
  createPrayerPartner,
  deletePrayerPartner,
  readPrayerPartners,
  updatePrayerPartner,
} from '@/features/prayer-partners/prayer-partners-api';

function normalizePartnerImageUrl(rawValue: string): {
  value: string | null;
  error: string | null;
} {
  const trimmed = rawValue.trim();
  if (!trimmed) return { value: null, error: null };
  if (trimmed.toLowerCase().startsWith('data:')) {
    return {
      value: null,
      error:
        'Image URL must be a hosted http(s) link. Base64 data URLs are not supported.',
    };
  }
  if (trimmed.length > 2048) {
    return {
      value: null,
      error: 'Image URL must be 2048 characters or less.',
    };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        value: null,
        error: 'Image URL must use http or https.',
      };
    }
  } catch {
    return {
      value: null,
      error: 'Image URL must be a valid URL.',
    };
  }
  return { value: trimmed, error: null };
}

export function PrayerPartnersPage() {
  const { showToast } = useToast();
  const [partners, setPartners] = useState<PrayerPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [needsUpdateOnly, setNeedsUpdateOnly] = useState(false);
  const [needsUpdateDays, setNeedsUpdateDays] = useState('14');
  const [imageFilter, setImageFilter] = useState<'all' | 'has' | 'none'>('all');
  const [notesFilter, setNotesFilter] = useState<'all' | 'has' | 'none'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'oldest'>('recent');
  const [name, setName] = useState('');
  const [prayerFocus, setPrayerFocus] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const loadPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await readPrayerPartners(includeArchived);
      setPartners(rows);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load partners');
    } finally {
      setIsLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  async function onCreatePartner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !prayerFocus.trim()) return;
    const parsedImageUrl = normalizePartnerImageUrl(imageUrl);
    if (parsedImageUrl.error) {
      showToast({
        title: 'Invalid image URL',
        description: parsedImageUrl.error,
        variant: 'error',
      });
      return;
    }
    setIsSaving(true);
    try {
      await createPrayerPartner({
        name: name.trim(),
        prayerFocus: prayerFocus.trim(),
        imageUrl: parsedImageUrl.value,
      });
      setName('');
      setPrayerFocus('');
      setImageUrl('');
      showToast({
        title: 'Prayer partner added',
        variant: 'success',
      });
      await loadPartners();
    } catch (err) {
      showToast({
        title: 'Could not add partner',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function onToggleArchived(partner: PrayerPartner) {
    try {
      await updatePrayerPartner(partner.partnerId, {
        isArchived: !partner.isArchived,
      });
      showToast({
        title: partner.isArchived ? 'Partner restored' : 'Partner archived',
        variant: 'success',
      });
      await loadPartners();
    } catch (err) {
      showToast({
        title: 'Could not update partner',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onDeletePartner(partner: PrayerPartner) {
    if (!window.confirm(`Delete ${partner.name}? This cannot be undone.`))
      return;
    try {
      await deletePrayerPartner(partner.partnerId);
      showToast({
        title: 'Partner deleted',
        variant: 'success',
      });
      await loadPartners();
    } catch (err) {
      showToast({
        title: 'Could not delete partner',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  const filteredPartners = useMemo(() => {
    const days = Math.max(1, Number(needsUpdateDays) || 14);
    const nowMs = Date.now();
    const list = partners.filter((partner) => {
      const hasImage = Boolean(partner.imageUrl);
      const hasNotes = (partner.noteCount ?? 0) > 0;
      const needsUpdate =
        !partner.lastNoteAt ||
        nowMs - new Date(partner.lastNoteAt).getTime() >
          days * 24 * 60 * 60 * 1000;
      if (needsUpdateOnly && !needsUpdate) return false;
      if (imageFilter === 'has' && !hasImage) return false;
      if (imageFilter === 'none' && hasImage) return false;
      if (notesFilter === 'has' && !hasNotes) return false;
      if (notesFilter === 'none' && hasNotes) return false;
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
        a.lastNoteAt ? new Date(a.lastNoteAt).getTime() : 0,
      );
      const bRecent = Math.max(
        new Date(b.updatedAt).getTime(),
        b.lastNoteAt ? new Date(b.lastNoteAt).getTime() : 0,
      );
      return bRecent - aRecent;
    });
  }, [
    imageFilter,
    needsUpdateDays,
    needsUpdateOnly,
    notesFilter,
    partners,
    sortBy,
  ]);

  return (
    <>
      <SectionHeader
        title="Prayer Partners"
        description="Add people you are praying for, record what they need, and track updates over time."
      />

      <Card className="mb-4 space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Add prayer partner
        </h2>
        <form
          className="space-y-3"
          onSubmit={(event) => void onCreatePartner(event)}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            What are you praying for?
            <textarea
              value={prayerFocus}
              onChange={(event) => setPrayerFocus(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Health, wisdom, family, work situation..."
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Image URL (optional)
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Use a hosted http(s) image link. Base64 data URLs are not
              supported.
            </span>
          </label>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add partner'}
          </Button>
        </form>
      </Card>

      <div className="mb-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Your roster</h2>
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
              checked={needsUpdateOnly}
              onChange={(event) => setNeedsUpdateOnly(event.target.checked)}
            />
            Needs update only
          </label>
          <label className="block text-sm text-slate-700">
            Needs update days
            <Input
              type="number"
              min={1}
              max={365}
              className="mt-1"
              value={needsUpdateDays}
              onChange={(event) => setNeedsUpdateDays(event.target.value)}
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
          <label className="block text-sm text-slate-700">
            Image filter
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={imageFilter}
              onChange={(event) =>
                setImageFilter(event.target.value as 'all' | 'has' | 'none')
              }>
              <option value="all">All</option>
              <option value="has">Has image</option>
              <option value="none">No image</option>
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            Notes filter
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={notesFilter}
              onChange={(event) =>
                setNotesFilter(event.target.value as 'all' | 'has' | 'none')
              }>
              <option value="all">All</option>
              <option value="has">Has notes</option>
              <option value="none">No notes</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading partners...</p>
      ) : null}

      {!isLoading && error ? (
        <EmptyState title="Could not load partners" description={error} />
      ) : null}

      {!isLoading && !error && filteredPartners.length === 0 ? (
        <EmptyState
          title="No prayer partners match this filter"
          description="Try adjusting filters or add your first partner above."
        />
      ) : null}

      {!isLoading && !error && filteredPartners.length > 0 ? (
        <div className="space-y-3">
          {filteredPartners.map((partner) => (
            <Card key={partner.partnerId} className="space-y-3 border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {partner.name}
                    {partner.isArchived ? ' (Archived)' : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {partner.prayerFocus}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Notes: {partner.noteCount ?? 0}
                    {partner.lastNoteAt
                      ? ` · Last update ${new Date(partner.lastNoteAt).toLocaleDateString()}`
                      : ' · No updates yet'}
                  </p>
                </div>
                {partner.imageUrl ? (
                  <img
                    src={partner.imageUrl}
                    alt={`${partner.name} avatar`}
                    className="size-12 rounded-full border border-slate-200 object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/prayer-partners/${partner.partnerId}`}>
                  <Button variant="ghost">Open details</Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => void onToggleArchived(partner)}>
                  {partner.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void onDeletePartner(partner)}>
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
