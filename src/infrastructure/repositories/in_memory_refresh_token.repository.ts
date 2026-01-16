import type { RefreshTokenRepository } from "../../domain/repositories/refresh_token_repository.interface";
import { RefreshToken } from "../../domain/entities/refresh_token.entity";

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    this.tokens.set(refreshToken.token, refreshToken);
    return refreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.tokens.get(token) || null;
  }

  async revokeToken(token: string): Promise<void> {
    const refreshToken = this.tokens.get(token);
    if (refreshToken) {
      const revokedToken = new RefreshToken(
        refreshToken.id,
        refreshToken.userId,
        refreshToken.token,
        refreshToken.expiresAt,
        refreshToken.createdAt,
        new Date()
      );
      this.tokens.set(token, revokedToken);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    for (const [token, refreshToken] of this.tokens.entries()) {
      if (refreshToken.userId === userId && !refreshToken.isRevoked()) {
        await this.revokeToken(token);
      }
    }
  }

  async deleteExpiredTokens(): Promise<number> {
    let deletedCount = 0;
    for (const [token, refreshToken] of this.tokens.entries()) {
      if (refreshToken.isExpired()) {
        this.tokens.delete(token);
        deletedCount++;
      }
    }
    return deletedCount;
  }
}
