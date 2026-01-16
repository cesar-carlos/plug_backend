import type { RefreshTokenRepository } from "../../domain/repositories/refresh_token_repository.interface";
import { RefreshToken } from "../../domain/entities/refresh_token.entity";
import { Database } from "../database/database";

export class SQLiteRefreshTokenRepository implements RefreshTokenRepository {
  private db = Database.getInstance().getConnection();
  private _insertStmt: ReturnType<typeof this.db.prepare> | null = null;
  private _findByTokenStmt: ReturnType<typeof this.db.prepare> | null = null;
  private _revokeTokenStmt: ReturnType<typeof this.db.prepare> | null = null;
  private _revokeAllUserTokensStmt: ReturnType<typeof this.db.prepare> | null =
    null;
  private _deleteExpiredTokensStmt: ReturnType<typeof this.db.prepare> | null =
    null;

  private get insertStmt() {
    if (!this._insertStmt) {
      this._insertStmt = this.db.prepare(
        "INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
    }
    return this._insertStmt;
  }

  private get findByTokenStmt() {
    if (!this._findByTokenStmt) {
      this._findByTokenStmt = this.db.prepare(
        "SELECT * FROM refresh_tokens WHERE token = ?"
      );
    }
    return this._findByTokenStmt;
  }

  private get revokeTokenStmt() {
    if (!this._revokeTokenStmt) {
      this._revokeTokenStmt = this.db.prepare(
        'UPDATE refresh_tokens SET revoked_at = datetime("now") WHERE token = ?'
      );
    }
    return this._revokeTokenStmt;
  }

  private get revokeAllUserTokensStmt() {
    if (!this._revokeAllUserTokensStmt) {
      this._revokeAllUserTokensStmt = this.db.prepare(
        'UPDATE refresh_tokens SET revoked_at = datetime("now") WHERE user_id = ? AND revoked_at IS NULL'
      );
    }
    return this._revokeAllUserTokensStmt;
  }

  private get deleteExpiredTokensStmt() {
    if (!this._deleteExpiredTokensStmt) {
      this._deleteExpiredTokensStmt = this.db.prepare(
        'DELETE FROM refresh_tokens WHERE expires_at < datetime("now")'
      );
    }
    return this._deleteExpiredTokensStmt;
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    try {
      this.insertStmt.run(
        refreshToken.id,
        refreshToken.userId,
        refreshToken.token,
        refreshToken.expiresAt.toISOString(),
        refreshToken.createdAt.toISOString(),
        refreshToken.revokedAt?.toISOString() || null
      );

      return refreshToken;
    } catch (err) {
      throw new Error(`Failed to create refresh token: ${err}`);
    }
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const result = this.findByTokenStmt.get(token) as
        | {
            id: string;
            user_id: string;
            token: string;
            expires_at: string;
            created_at: string;
            revoked_at: string | null;
          }
        | undefined;

      if (!result) {
        return null;
      }

      return new RefreshToken(
        result.id,
        result.user_id,
        result.token,
        new Date(result.expires_at),
        new Date(result.created_at),
        result.revoked_at ? new Date(result.revoked_at) : null
      );
    } catch (err) {
      throw new Error(`Failed to find refresh token: ${err}`);
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      this.revokeTokenStmt.run(token);
    } catch (err) {
      throw new Error(`Failed to revoke refresh token: ${err}`);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      this.revokeAllUserTokensStmt.run(userId);
    } catch (err) {
      throw new Error(`Failed to revoke all user tokens: ${err}`);
    }
  }

  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = this.deleteExpiredTokensStmt.run();
      return result.changes || 0;
    } catch (err) {
      throw new Error(`Failed to delete expired tokens: ${err}`);
    }
  }
}
