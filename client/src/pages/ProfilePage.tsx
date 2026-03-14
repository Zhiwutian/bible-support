import { useMemo, useState } from 'react';
import { Input } from '@/components/ui';
import { trackEvent } from '@/lib/telemetry';

type Props = {
  initialDisplayName: string | null;
  initialAvatarUrl: string | null;
  onSave: (payload: {
    displayName: string | null;
    avatarUrl: string | null;
  }) => Promise<void>;
};

function normalizeField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateAvatarUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      return 'Avatar URL must use http or https.';
    }
    return null;
  } catch {
    return 'Avatar URL must be a valid URL.';
  }
}

export function ProfilePage({
  initialDisplayName,
  initialAvatarUrl,
  onSave,
}: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const displayNameError =
    displayName.length > 120
      ? 'Display name must be 120 characters or less.'
      : null;
  const avatarValue = normalizeField(avatarUrl);
  const avatarError =
    avatarUrl.length > 2048
      ? 'Avatar URL must be 2048 characters or less.'
      : validateAvatarUrl(avatarValue);
  const canSubmit = !displayNameError && !avatarError && !isSaving;

  const previewName = normalizeField(displayName) ?? 'Scripture & Solace user';
  const previewAvatar = useMemo(() => {
    if (avatarError) return null;
    return avatarValue;
  }, [avatarError, avatarValue]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      trackEvent('profile_save_attempt');
      await onSave({
        displayName: normalizeField(displayName),
        avatarUrl: avatarValue,
      });
      trackEvent('profile_save_success');
      setSaveSuccess('Profile updated.');
    } catch (error) {
      trackEvent('profile_save_failure');
      const message =
        error instanceof Error ? error.message : 'Could not update profile.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <p className="mt-2 text-sm text-slate-600">
        Update your display name and avatar URL.
      </p>

      <div className="mt-5 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        {previewAvatar ? (
          <img
            src={previewAvatar}
            alt="Avatar preview"
            className="size-16 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
            {previewName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-slate-900">
            {previewName}
          </p>
          <p className="text-xs text-slate-600">Live preview</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Display name
          </span>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
          {displayNameError ? (
            <p className="mt-1 text-xs text-red-700">{displayNameError}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Avatar URL
          </span>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
          {avatarError ? (
            <p className="mt-1 text-xs text-red-700">{avatarError}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to remove your avatar.
            </p>
          )}
        </label>

        {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}
        {saveSuccess ? (
          <p className="text-sm text-green-700">{saveSuccess}</p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}
