import type { RefreshToken } from '../entities/refresh_token.entity';

export interface RefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revokeToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  deleteExpiredTokens(): Promise<number>;
}
