import type { Socket as BaseSocket } from 'socket.io';
import type { JWTPayload } from '../shared/utils/jwt_validator';

declare module 'socket.io' {
  interface Socket extends BaseSocket {
    emitCompressed(event: string, data: unknown): Promise<void>;
    data: {
      user?: JWTPayload;
    };
  }
}
