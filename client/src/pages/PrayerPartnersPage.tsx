import type { PrayerPartner } from '@shared/prayer-contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeader,
  Select,
} from '@/components/ui';
import { PrayerFilterModalShell } from '@/features/prayer/PrayerFilterModalShell';
import { PrayerHubInsightsBar } from '@/features/prayer/PrayerHubInsightsBar';
import { usePrayerPageInsights } from '@/features/prayer/use-prayer-page-insights';
import { usePrayerReminder } from '@/features/prayer/use-prayer-reminder';
import {
  createPrayerPartner,
  deletePrayerPartner,
  readPrayerPartners,
  updatePrayerPartner,
} from '@/features/prayer-partners/prayer-partners-api';
import {
  prayerPartnersRouteStateSchema,
  readRouteState,
  writeRouteState,
  type PrayerPartnersRouteState,
} from '@/lib/route-session-state';

const PRAYER_PARTNERS_ROUTE_PATH = '/prayer-partners';

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

type PartnerFiltersDraft = {
  includeArchived: boolean;
  needsUpdateOnly: boolean;
  needsUpdateDays: string;
  imageFilter: 'all' | 'has' | 'none';
  notesFilter: 'all' | 'has' | 'none';
  sortBy: 'recent' | 'name' | 'oldest';
};

export function PrayerPartnersPage() {
  const { showToast } = useToast();
  const prayerRouteInitialRef = useRef<PrayerPartnersRouteState | null>(null);
  if (prayerRouteInitialRef.current === null && typeof window !== 'undefined') {
    prayerRouteInitialRef.current = readRouteState(
      PRAYER_PARTNERS_ROUTE_PATH,
      prayerPartnersRouteStateSchema,
    );
  }
  const prInitial = prayerRouteInitialRef.current;

  const [partners, setPartners] = useState<PrayerPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [includeArchived, setIncludeArchived] = useState(
    () => prInitial?.includeArchived ?? false,
  );
  const [needsUpdateOnly, setNeedsUpdateOnly] = useState(
    () => prInitial?.needsUpdateOnly ?? false,
  );
  const [needsUpdateDays, setNeedsUpdateDays] = useState(
    () => prInitial?.needsUpdateDays ?? '14',
  );
  const [imageFilter, setImageFilter] = useState<'all' | 'has' | 'none'>(
    () => prInitial?.imageFilter ?? 'all',
  );
  const [notesFilter, setNotesFilter] = useState<'all' | 'has' | 'none'>(
    () => prInitial?.notesFilter ?? 'all',
  );
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'oldest'>(
    () => prInitial?.sortBy ?? 'recent',
  );
  const [name, setName] = useState('');
  const [prayerFocus, setPrayerFocus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { insights, insightsLoading, insightsError, setInsights } =
    usePrayerPageInsights();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<PartnerFiltersDraft>(() => ({
    includeArchived: prInitial?.includeArchived ?? false,
    needsUpdateOnly: prInitial?.needsUpdateOnly ?? false,
    needsUpdateDays: prInitial?.needsUpdateDays ?? '14',
    imageFilter: prInitial?.imageFilter ?? 'all',
    notesFilter: prInitial?.notesFilter ?? 'all',
    sortBy: prInitial?.sortBy ?? 'recent',
  }));

  usePrayerReminder(insights);

  useEffect(() => {
    const y = prInitial?.scrollY;
    if (y == null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    });
  }, [prInitial?.scrollY]);

  const persistPrayerPartnersRoute = useCallback(() => {
    writeRouteState(PRAYER_PARTNERS_ROUTE_PATH, {
      version: 1,
      includeArchived,
      needsUpdateOnly,
      needsUpdateDays,
      imageFilter,
      notesFilter,
      sortBy,
      scrollY: Math.max(0, window.scrollY),
    });
  }, [
    includeArchived,
    needsUpdateOnly,
    needsUpdateDays,
    imageFilter,
    notesFilter,
    sortBy,
  ]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      persistPrayerPartnersRoute();
    }, 300);
    return () => window.clearTimeout(handle);
  }, [persistPrayerPartnersRoute]);

  useEffect(() => {
    let timeoutId: number | undefined;
    function onScroll() {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        timeoutId = undefined;
        persistPrayerPartnersRoute();
      }, 200);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [persistPrayerPartnersRoute]);

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

  useEffect(() => {
    if (!filtersOpen) return;
    setDraft({
      includeArchived,
      needsUpdateOnly,
      needsUpdateDays,
      imageFilter,
      notesFilter,
      sortBy,
    });
  }, [
    filtersOpen,
    includeArchived,
    needsUpdateOnly,
    needsUpdateDays,
    imageFilter,
    notesFilter,
    sortBy,
  ]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (includeArchived) n += 1;
    if (needsUpdateOnly) n += 1;
    if (needsUpdateDays !== '14') n += 1;
    if (imageFilter !== 'all') n += 1;
    if (notesFilter !== 'all') n += 1;
    if (sortBy !== 'recent') n += 1;
    return n;
  }, [
    includeArchived,
    imageFilter,
    needsUpdateDays,
    needsUpdateOnly,
    notesFilter,
    sortBy,
  ]);

  function applyFiltersFromDraft() {
    setIncludeArchived(draft.includeArchived);
    setNeedsUpdateOnly(draft.needsUpdateOnly);
    setNeedsUpdateDays(draft.needsUpdateDays);
    setImageFilter(draft.imageFilter);
    setNotesFilter(draft.notesFilter);
    setSortBy(draft.sortBy);
    setFiltersOpen(false);
  }

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
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Prayer Partners"
        description="Add people you are praying for, record what they need, and track updates over time."
      />

      <PrayerHubInsightsBar
        insights={insights}
        isLoading={insightsLoading}
        loadError={insightsError}
        onInsightsUpdated={setInsights}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      <PrayerFilterModalShell
        title="Filter roster"
        titleId="prayer-partners-filters-title"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={applyFiltersFromDraft}>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.includeArchived}
            onChange={(event) =>
              setDraft((d) => ({
                ...d,
                includeArchived: event.target.checked,
              }))
            }
          />
          Show archived
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.needsUpdateOnly}
            onChange={(event) =>
              setDraft((d) => ({
                ...d,
                needsUpdateOnly: event.target.checked,
              }))
            }
          />
          Needs update only
        </label>
        <label className="block text-sm text-slate-700">
          Needs update days
          <Input
            type="number"
            min={1}
            max={365}
            className="mt-1 min-h-11"
            value={draft.needsUpdateDays}
            onChange={(event) =>
              setDraft((d) => ({
                ...d,
                needsUpdateDays: event.target.value,
              }))
            }
          />
        </label>
        <Select
          label="Sort"
          value={draft.sortBy}
          onChange={(event) =>
            setDraft((d) => ({
              ...d,
              sortBy: event.target.value as PartnerFiltersDraft['sortBy'],
            }))
          }>
          <option value="recent">Recent activity</option>
          <option value="name">Alphabetical</option>
          <option value="oldest">Oldest first</option>
        </Select>
        <Select
          label="Image filter"
          value={draft.imageFilter}
          onChange={(event) =>
            setDraft((d) => ({
              ...d,
              imageFilter: event.target
                .value as PartnerFiltersDraft['imageFilter'],
            }))
          }>
          <option value="all">All</option>
          <option value="has">Has image</option>
          <option value="none">No image</option>
        </Select>
        <Select
          label="Notes filter"
          value={draft.notesFilter}
          onChange={(event) =>
            setDraft((d) => ({
              ...d,
              notesFilter: event.target
                .value as PartnerFiltersDraft['notesFilter'],
            }))
          }>
          <option value="all">All</option>
          <option value="has">Has notes</option>
          <option value="none">No notes</option>
        </Select>
      </PrayerFilterModalShell>

      <Card className="space-y-3 border p-4 sm:p-5">
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
              className="mt-1 min-h-11"
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
              className="mt-1 min-h-11"
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

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">Your roster</h2>
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
            <Card
              key={partner.partnerId}
              className="space-y-3 border p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
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
                    className="mx-auto size-14 shrink-0 rounded-full border border-slate-200 object-cover sm:mx-0 sm:size-12"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  to={`/prayer-partners/${partner.partnerId}`}
                  className="w-full sm:w-auto">
                  <Button variant="ghost" className="min-h-11 w-full sm:w-auto">
                    Open details
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => void onToggleArchived(partner)}>
                  {partner.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => void onDeletePartner(partner)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
