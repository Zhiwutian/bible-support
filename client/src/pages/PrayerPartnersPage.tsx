import { useCallback, useEffect, useState } from 'react';
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

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Your roster</h2>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Show archived
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading partners...</p>
      ) : null}

      {!isLoading && error ? (
        <EmptyState title="Could not load partners" description={error} />
      ) : null}

      {!isLoading && !error && partners.length === 0 ? (
        <EmptyState
          title="No prayer partners yet"
          description="Add your first partner above to begin building your prayer roster."
        />
      ) : null}

      {!isLoading && !error && partners.length > 0 ? (
        <div className="space-y-3">
          {partners.map((partner) => (
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
