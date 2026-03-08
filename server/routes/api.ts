import { Router } from 'express';
import {
  getEmotions,
  getEmotionScriptures,
  getRandomEmotionScripture,
} from '@server/controllers/emotion-controller.js';
import {
  readHealth,
  readReady,
} from '@server/controllers/health-controller.js';
import { readHello } from '@server/controllers/hello-controller.js';
import { getScriptureContext } from '@server/controllers/scripture-context-controller.js';
import {
  deleteTodo,
  getTodos,
  patchTodo,
  postTodo,
} from '@server/controllers/todo-controller.js';

const apiRouter = Router();

apiRouter.get('/hello', readHello);
apiRouter.get('/health', readHealth);
apiRouter.get('/ready', readReady);
apiRouter.get('/emotions', getEmotions);
apiRouter.get('/emotions/:slug/scriptures', getEmotionScriptures);
apiRouter.get('/emotions/:slug/scriptures/random', getRandomEmotionScripture);
apiRouter.get('/scripture-context', getScriptureContext);
apiRouter.get('/todos', getTodos);
apiRouter.post('/todos', postTodo);
apiRouter.patch('/todos/:todoId', patchTodo);
apiRouter.delete('/todos/:todoId', deleteTodo);

export default apiRouter;
