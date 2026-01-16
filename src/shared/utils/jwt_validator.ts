import { jwtVerify } from 'jose';
import { env } from '../config/env';
import { logger } from './logger';

export interface JWTPayload {
  username: string;
  role: string;
}

export const verifyJWT = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload.username || !payload.role) {
      logger.warn({ payload }, 'Invalid JWT payload structure');
      return null;
    }

    return {
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch (err) {
    logger.warn({ err }, 'JWT verification failed');
    return null;
  }
};
