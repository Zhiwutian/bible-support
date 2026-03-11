// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used to identify the Request we are extending
import { Request } from 'express';

declare global {
  namespace Express {
    export interface Request {
      /** Admin bearer-token claims populated by `authMiddleware`. */
      user?: {
        userId: string | number;
      };
      /** Session user id populated by `attachUserSession` middleware. */
      authUserId?: string;
    }
  }
}
