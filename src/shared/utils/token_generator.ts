import { randomBytes } from 'crypto';

/**
 * Generate a secure random refresh token
 */
export const generateRefreshToken = (): string => {
  return randomBytes(32).toString('hex');
};
