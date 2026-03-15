import { Router } from 'express';
import { authMiddleware } from '@server/lib/authorization-middleware.js';
import { requireAdminSession } from '@server/lib/admin-session-middleware.js';
import {
  getAuthCallback,
  getAuthLogin,
  getAuthLogout,
  getAuthMe,
  patchAuthMe,
  postAuthLogout,
} from '@server/controllers/auth/auth-controller.js';
import {
  getAdminAuthEvents,
  getAdminUsers,
  patchAdminUserRole,
} from '@server/controllers/admin/admin-controller.js';
import {
  getEmotions,
  getEmotionScriptures,
  getRandomEmotionScripture,
} from '@server/controllers/emotions/emotion-controller.js';
import {
  readHealth,
  readReady,
} from '@server/controllers/health/health-controller.js';
import { readHello } from '@server/controllers/system/hello-controller.js';
import { getScriptureSourcesDiagnostics } from '@server/controllers/scripture/scripture-diagnostics-controller.js';
import { getReaderChapter } from '@server/controllers/scripture/reader-controller.js';
import {
  deleteReaderState,
  getReaderState,
  patchReaderState,
} from '@server/controllers/scripture/reader-state-controller.js';
import {
  deleteSavedScripture,
  getSavedScriptureGroups,
  getSavedScriptures,
  patchSavedScripture,
  patchSavedScriptureNote,
  postSavedScriptureBatch,
  postSavedScripture,
} from '@server/controllers/scripture/saved-scripture-controller.js';
import { getScriptureSearch } from '@server/controllers/scripture/scripture-search-controller.js';
import { getScriptureContext } from '@server/controllers/scripture/scripture-context-controller.js';

const apiRouter = Router();

apiRouter.get('/hello', readHello);
apiRouter.get('/health', readHealth);
apiRouter.get('/ready', readReady);
apiRouter.get('/auth/login', getAuthLogin);
apiRouter.get('/auth/callback', getAuthCallback);
apiRouter.get('/auth/logout', getAuthLogout);
apiRouter.post('/auth/logout', postAuthLogout);
apiRouter.get('/auth/me', getAuthMe);
apiRouter.patch('/auth/me', patchAuthMe);
apiRouter.get(
  '/admin/scripture-sources',
  authMiddleware,
  getScriptureSourcesDiagnostics,
);
apiRouter.get('/admin/users', requireAdminSession, getAdminUsers);
apiRouter.patch(
  '/admin/users/:userId/role',
  requireAdminSession,
  patchAdminUserRole,
);
apiRouter.get('/admin/auth-events', requireAdminSession, getAdminAuthEvents);
apiRouter.get('/emotions', getEmotions);
apiRouter.get('/emotions/:slug/scriptures', getEmotionScriptures);
apiRouter.get('/emotions/:slug/scriptures/random', getRandomEmotionScripture);
apiRouter.get('/scripture-context', getScriptureContext);
apiRouter.get('/scriptures/search', getScriptureSearch);
apiRouter.get('/reader/chapter', getReaderChapter);
apiRouter.get('/reader/state', getReaderState);
apiRouter.patch('/reader/state', patchReaderState);
apiRouter.delete('/reader/state', deleteReaderState);
apiRouter.get('/saved-scriptures', getSavedScriptures);
apiRouter.get('/saved-scriptures/grouped', getSavedScriptureGroups);
apiRouter.post('/saved-scriptures', postSavedScripture);
apiRouter.post('/saved-scriptures/batch', postSavedScriptureBatch);
apiRouter.patch('/saved-scriptures/:savedId', patchSavedScripture);
apiRouter.patch('/saved-scriptures/:savedId/note', patchSavedScriptureNote);
apiRouter.delete('/saved-scriptures/:savedId', deleteSavedScripture);

export default apiRouter;
