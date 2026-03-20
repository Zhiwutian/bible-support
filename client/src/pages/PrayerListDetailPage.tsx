import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PrayerList, PrayerPartner } from '@shared/prayer-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeader,
} from '@/components/ui';
import {
  addPrayerListMember,
  createPrayerListSession,
  deletePrayerListMember,
  readPrayerList,
  readPrayerListMembers,
  readPrayerListSessions,
  reorderPrayerListMembers,
  updatePrayerList,
  type PrayerListMemberWithPartner,
} from '@/features/prayer-lists/prayer-lists-api';
import { readPrayerPartners } from '@/features/prayer-partners/prayer-partners-api';

export function PrayerListDetailPage() {
  const { listId } = useParams();
  const { showToast } = useToast();
  const parsedListId = Number(listId);
  const [list, setList] = useState<PrayerList | null>(null);
  const [members, setMembers] = useState<PrayerListMemberWithPartner[]>([]);
  const [sessions, setSessions] = useState<
    Array<{ prayerSessionId: number; note: string | null; createdAt: string }>
  >([]);
  const [partners, setPartners] = useState<PrayerPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number>(0);
  const [prayerNote, setPrayerNote] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(parsedListId) || parsedListId <= 0) {
      setError('Invalid prayer list id.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [listPayload, membersPayload, sessionsPayload, partnersPayload] =
        await Promise.all([
          readPrayerList(parsedListId),
          readPrayerListMembers(parsedListId),
          readPrayerListSessions(parsedListId),
          readPrayerPartners(false),
        ]);
      setList(listPayload);
      setName(listPayload.name);
      setDescription(listPayload.description ?? '');
      setMembers(membersPayload);
      setSessions(
        sessionsPayload.map((session) => ({
          prayerSessionId: session.prayerSessionId,
          note: session.note,
          createdAt: session.createdAt,
        })),
      );
      setPartners(partnersPayload);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load prayer list',
      );
    } finally {
      setIsLoading(false);
    }
  }, [parsedListId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const selectablePartners = useMemo(() => {
    const inList = new Set(members.map((member) => member.partnerId));
    return partners.filter(
      (partner) => !partner.isArchived && !inList.has(partner.partnerId),
    );
  }, [members, partners]);

  async function onSaveListDetails() {
    if (!list) return;
    try {
      const updated = await updatePrayerList(list.listId, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      });
      setList(updated);
      showToast({ title: 'List updated', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not update list',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onAddMember() {
    if (!list || !selectedPartnerId) return;
    try {
      await addPrayerListMember(list.listId, { partnerId: selectedPartnerId });
      setSelectedPartnerId(0);
      await loadDetail();
      showToast({ title: 'Partner added to list', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not add partner',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onRemoveMember(partnerIdValue: number) {
    if (!list) return;
    try {
      await deletePrayerListMember(list.listId, partnerIdValue);
      await loadDetail();
      showToast({ title: 'Partner removed from list', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not remove partner',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onMoveMember(
    partnerIdValue: number,
    direction: 'up' | 'down',
  ) {
    if (!list) return;
    const index = members.findIndex(
      (member) => member.partnerId === partnerIdValue,
    );
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;
    const reordered = members.slice();
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    try {
      await reorderPrayerListMembers(list.listId, {
        partnerIdsInOrder: reordered.map((item) => item.partnerId),
      });
      await loadDetail();
    } catch (err) {
      showToast({
        title: 'Could not reorder members',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onPrayNow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!list) return;
    try {
      await createPrayerListSession(list.listId, {
        note: prayerNote.trim() ? prayerNote.trim() : null,
      });
      setPrayerNote('');
      await loadDetail();
      showToast({ title: 'Prayer session logged', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not log prayer session',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  if (isLoading)
    return <p className="text-sm text-slate-600">Loading prayer list...</p>;

  if (error || !list) {
    return (
      <EmptyState
        title="Prayer list unavailable"
        description={error || 'This list could not be found.'}
        actions={
          <Link to="/prayer-lists">
            <Button variant="ghost">Back to lists</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <SectionHeader
        title={list.name}
        description="Manage list members, keep an intentional order, and log each prayer session."
      />

      <Card className="mb-4 space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">List details</h2>
        <label className="block text-sm font-medium text-slate-700">
          Name
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => void onSaveListDetails()}>
            Save details
          </Button>
          <Link to="/prayer-lists">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </Card>

      <Card className="mb-4 space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">Members</h2>
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <label className="block flex-1 text-sm font-medium text-slate-700">
            Add partner
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={selectedPartnerId || ''}
              onChange={(event) =>
                setSelectedPartnerId(Number(event.target.value))
              }>
              <option value="">Select a partner...</option>
              {selectablePartners.map((partner) => (
                <option key={partner.partnerId} value={partner.partnerId}>
                  {partner.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="primary"
            onClick={() => void onAddMember()}
            disabled={!selectedPartnerId}>
            Add
          </Button>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-slate-600">
            No partners in this list yet.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member, index) => (
              <div
                key={member.prayerListMemberId}
                className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {index + 1}. {member.partner.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {member.partner.prayerFocus}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => void onMoveMember(member.partnerId, 'up')}
                    disabled={index === 0}>
                    Up
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void onMoveMember(member.partnerId, 'down')}
                    disabled={index === members.length - 1}>
                    Down
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void onRemoveMember(member.partnerId)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 border p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Prayer sessions
        </h2>
        <form className="space-y-2" onSubmit={(event) => void onPrayNow(event)}>
          <textarea
            value={prayerNote}
            onChange={(event) => setPrayerNote(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Optional note for this prayer time..."
          />
          <Button variant="primary" type="submit">
            Pray now (log session)
          </Button>
        </form>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-600">No sessions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.prayerSessionId}
                className="rounded-md border p-3">
                <p className="text-xs text-slate-500">
                  {new Date(session.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {session.note || 'No note added.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
