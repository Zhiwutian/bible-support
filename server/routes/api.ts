import { Router } from 'express';
import { authMiddleware } from '@server/lib/authorization-middleware.js';
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
import {
  deleteSavedScripture,
  getSavedScriptures,
  patchSavedScripture,
  postSavedScripture,
} from '@server/controllers/scripture/saved-scripture-controller.js';
import { getScriptureSearch } from '@server/controllers/scripture/scripture-search-controller.js';
import { getScriptureContext } from '@server/controllers/scripture/scripture-context-controller.js';
import {
  deleteTodo,
  getTodos,
  patchTodo,
  postTodo,
} from '@server/controllers/todos/todo-controller.js';

const apiRouter = Router();

apiRouter.get('/hello', readHello);
apiRouter.get('/health', readHealth);
apiRouter.get('/ready', readReady);
apiRouter.get(
  '/admin/scripture-sources',
  authMiddleware,
  getScriptureSourcesDiagnostics,
);
apiRouter.get('/emotions', getEmotions);
apiRouter.get('/emotions/:slug/scriptures', getEmotionScriptures);
apiRouter.get('/emotions/:slug/scriptures/random', getRandomEmotionScripture);
apiRouter.get('/scripture-context', getScriptureContext);
apiRouter.get('/scriptures/search', getScriptureSearch);
apiRouter.get('/saved-scriptures', getSavedScriptures);
apiRouter.post('/saved-scriptures', postSavedScripture);
apiRouter.patch('/saved-scriptures/:savedId', patchSavedScripture);
apiRouter.delete('/saved-scriptures/:savedId', deleteSavedScripture);
apiRouter.get('/todos', getTodos);
apiRouter.post('/todos', postTodo);
apiRouter.patch('/todos/:todoId', patchTodo);
apiRouter.delete('/todos/:todoId', deleteTodo);

export default apiRouter;
