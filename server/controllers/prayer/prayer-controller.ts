import { z } from 'zod';
import type {
  AddPrayerListMemberRequest,
  CreatePrayerListRequest,
  CreatePrayerPartnerNoteRequest,
  CreatePrayerPartnerRequest,
  CreatePrayerSessionRequest,
  ReorderPrayerListMembersRequest,
  UpdatePrayerListRequest,
  UpdatePrayerPartnerNoteRequest,
  UpdatePrayerPartnerRequest,
} from '@shared/prayer-contracts.js';
import { requireSessionUserId } from '@server/lib/auth-context.js';
import { asyncHandler, sendSuccess } from '@server/lib/index.js';
import {
  addPrayerListMember,
  createPrayerList,
  createPrayerPartner,
  createPrayerPartnerNote,
  createPrayerSession,
  readPrayerList,
  readPrayerListMembers,
  readPrayerLists,
  readPrayerPartner,
  readPrayerPartnerNotes,
  readPrayerPartners,
  readPrayerSessions,
  removePrayerList,
  removePrayerListMember,
  removePrayerPartner,
  removePrayerPartnerNote,
  reorderPrayerListMembers,
  updatePrayerList,
  updatePrayerPartner,
  updatePrayerPartnerNote,
} from '@server/services/prayer-service.js';

const includeArchivedQuerySchema = z.object({
  includeArchived: z.coerce.boolean().optional().default(false),
});

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listIdParamsSchema = z.object({
  listId: z.coerce.number().int().positive(),
});

const partnerIdParamsSchema = z.object({
  partnerId: z.coerce.number().int().positive(),
});

const partnerNoteParamsSchema = z.object({
  partnerId: z.coerce.number().int().positive(),
  noteId: z.coerce.number().int().positive(),
});

const listMemberParamsSchema = z.object({
  listId: z.coerce.number().int().positive(),
  partnerId: z.coerce.number().int().positive(),
});

const prayerPartnerImageUrlSchema = z
  .string()
  .trim()
  .max(2048, {
    message:
      'imageUrl must be 2048 characters or less. Use a hosted http(s) URL, not base64 data.',
  })
  .superRefine((value, ctx) => {
    if (value.toLowerCase().startsWith('data:')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'imageUrl must be a hosted http(s) URL. Base64 data URLs are not supported.',
      });
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'imageUrl must be a valid URL',
      });
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'imageUrl must use http or https',
      });
    }
  });

const createPrayerPartnerBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  prayerFocus: z.string().trim().min(1).max(4000),
  imageUrl: prayerPartnerImageUrlSchema.nullable().optional(),
});

const updatePrayerPartnerBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    prayerFocus: z.string().trim().min(1).max(4000).optional(),
    imageUrl: prayerPartnerImageUrlSchema.nullable().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'at least one field must be provided',
  });

const createPrayerListBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
});

const updatePrayerListBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'at least one field must be provided',
  });

const addPrayerListMemberBodySchema = z.object({
  partnerId: z.number().int().positive(),
  position: z.number().int().positive().optional(),
});

const reorderPrayerListMembersBodySchema = z.object({
  partnerIdsInOrder: z.array(z.number().int().positive()).min(1),
});

const createPrayerSessionBodySchema = z.object({
  note: z.string().trim().max(4000).nullable().optional(),
});

const createPrayerPartnerNoteBodySchema = z.object({
  note: z.string().trim().min(1).max(4000),
});

const updatePrayerPartnerNoteBodySchema = z.object({
  note: z.string().trim().min(1).max(4000),
});

export const getPrayerPartners = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const query = includeArchivedQuerySchema.parse(req.query);
  const payload = await readPrayerPartners(ownerUserId, query.includeArchived);
  sendSuccess(res, payload);
});

export const getPrayerPartnerById = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = idParamsSchema.parse(req.params);
  const payload = await readPrayerPartner(ownerUserId, params.id);
  sendSuccess(res, payload);
});

export const postPrayerPartner = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const body = createPrayerPartnerBodySchema.parse(
    req.body,
  ) as CreatePrayerPartnerRequest;
  const payload = await createPrayerPartner({ ownerUserId, ...body });
  sendSuccess(res, payload, 201);
});

export const patchPrayerPartner = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = idParamsSchema.parse(req.params);
  const body = updatePrayerPartnerBodySchema.parse(
    req.body,
  ) as UpdatePrayerPartnerRequest;
  const payload = await updatePrayerPartner(ownerUserId, params.id, body);
  sendSuccess(res, payload);
});

export const deletePrayerPartner = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = idParamsSchema.parse(req.params);
  await removePrayerPartner(ownerUserId, params.id);
  res.sendStatus(204);
});

export const getPrayerPartnerNotes = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = partnerIdParamsSchema.parse(req.params);
  const payload = await readPrayerPartnerNotes(ownerUserId, params.partnerId);
  sendSuccess(res, payload);
});

export const postPrayerPartnerNote = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = partnerIdParamsSchema.parse(req.params);
  const body = createPrayerPartnerNoteBodySchema.parse(
    req.body,
  ) as CreatePrayerPartnerNoteRequest;
  const payload = await createPrayerPartnerNote({
    ownerUserId,
    partnerId: params.partnerId,
    note: body.note,
  });
  sendSuccess(res, payload, 201);
});

export const patchPrayerPartnerNote = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = partnerNoteParamsSchema.parse(req.params);
  const body = updatePrayerPartnerNoteBodySchema.parse(
    req.body,
  ) as UpdatePrayerPartnerNoteRequest;
  const payload = await updatePrayerPartnerNote(
    ownerUserId,
    params.partnerId,
    params.noteId,
    body.note,
  );
  sendSuccess(res, payload);
});

export const deletePrayerPartnerNote = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = partnerNoteParamsSchema.parse(req.params);
  await removePrayerPartnerNote(ownerUserId, params.partnerId, params.noteId);
  res.sendStatus(204);
});

export const getPrayerLists = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const query = includeArchivedQuerySchema.parse(req.query);
  const payload = await readPrayerLists(ownerUserId, query.includeArchived);
  sendSuccess(res, payload);
});

export const getPrayerListById = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const payload = await readPrayerList(ownerUserId, params.listId);
  sendSuccess(res, payload);
});

export const postPrayerList = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const body = createPrayerListBodySchema.parse(
    req.body,
  ) as CreatePrayerListRequest;
  const payload = await createPrayerList({ ownerUserId, ...body });
  sendSuccess(res, payload, 201);
});

export const patchPrayerList = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const body = updatePrayerListBodySchema.parse(
    req.body,
  ) as UpdatePrayerListRequest;
  const payload = await updatePrayerList(ownerUserId, params.listId, body);
  sendSuccess(res, payload);
});

export const deletePrayerList = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  await removePrayerList(ownerUserId, params.listId);
  res.sendStatus(204);
});

export const getPrayerListMembers = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const payload = await readPrayerListMembers(ownerUserId, params.listId);
  sendSuccess(res, payload);
});

export const postPrayerListMember = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const body = addPrayerListMemberBodySchema.parse(
    req.body,
  ) as AddPrayerListMemberRequest;
  const payload = await addPrayerListMember({
    ownerUserId,
    listId: params.listId,
    partnerId: body.partnerId,
    position: body.position,
  });
  sendSuccess(res, payload, 201);
});

export const deletePrayerListMember = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listMemberParamsSchema.parse(req.params);
  await removePrayerListMember(ownerUserId, params.listId, params.partnerId);
  res.sendStatus(204);
});

export const patchPrayerListMembersReorder = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const body = reorderPrayerListMembersBodySchema.parse(
    req.body,
  ) as ReorderPrayerListMembersRequest;
  const payload = await reorderPrayerListMembers({
    ownerUserId,
    listId: params.listId,
    partnerIdsInOrder: body.partnerIdsInOrder,
  });
  sendSuccess(res, payload);
});

export const getPrayerListSessions = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const payload = await readPrayerSessions(ownerUserId, params.listId);
  sendSuccess(res, payload);
});

export const postPrayerListSession = asyncHandler(async (req, res) => {
  const ownerUserId = requireSessionUserId(req);
  const params = listIdParamsSchema.parse(req.params);
  const body = createPrayerSessionBodySchema.parse(
    req.body,
  ) as CreatePrayerSessionRequest;
  const payload = await createPrayerSession({
    ownerUserId,
    listId: params.listId,
    note: body.note,
  });
  sendSuccess(res, payload, 201);
});
