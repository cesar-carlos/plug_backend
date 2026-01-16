import type { LoginUseCase, LoginResult } from '../../domain/use_cases/login.use_case';
import type { RegisterUseCase, RegisterResult } from '../../domain/use_cases/register.use_case';
import type { RefreshTokenUseCase } from '../../domain/use_cases/refresh_token.use_case';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh_token_repository.interface';
import type { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh_token.entity';
import { generateRefreshToken } from '../../shared/utils/token_generator';
import { calculateTokenExpiration, calculateRefreshTokenExpirationDate } from '../../shared/utils/token_expiration';
import { env } from '../../shared/config/env';

export interface AuthServiceResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  private async createRefreshToken(userId: string): Promise<string> {
    const refreshTokenValue = generateRefreshToken();
    const expiresAt = calculateRefreshTokenExpirationDate(env.JWT_REFRESH_TOKEN_EXPIRES_IN);

    const refreshToken = new RefreshToken(
      crypto.randomUUID(),
      userId,
      refreshTokenValue,
      expiresAt,
      new Date()
    );

    await this.refreshTokenRepository.create(refreshToken);
    return refreshTokenValue;
  }

  async login(
    username: string,
    password: string,
    jwtSign: (payload: { username: string; role: string; exp?: number }) => Promise<string>
  ): Promise<AuthServiceResult> {
    try {
      const result: LoginResult = await this.loginUseCase.execute(
        username,
        password
      );

      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }

      const exp = calculateTokenExpiration(env.JWT_ACCESS_TOKEN_EXPIRES_IN);
      const token = await jwtSign({
        username: result.user.username,
        role: result.user.role,
        ...(exp !== undefined && { exp }),
      });

      // Create refresh token
      const refreshToken = await this.createRefreshToken(result.user.id);

      return {
        success: true,
        token,
        refreshToken,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Authentication service error',
      };
    }
  }

  async register(
    username: string,
    password: string,
    role: string = 'user',
    jwtSign: (payload: { username: string; role: string; exp?: number }) => Promise<string>
  ): Promise<AuthServiceResult> {
    try {
      const result: RegisterResult = await this.registerUseCase.execute(username, password, role);

      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Registration failed',
        };
      }

      const exp = calculateTokenExpiration(env.JWT_ACCESS_TOKEN_EXPIRES_IN);
      const token = await jwtSign({
        username: result.user.username,
        role: result.user.role,
        ...(exp !== undefined && { exp }),
      });

      // Create refresh token
      const refreshToken = await this.createRefreshToken(result.user.id);

      return {
        success: true,
        token,
        refreshToken,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Registration service error',
      };
    }
  }

  async refresh(
    refreshToken: string,
    jwtSign: (payload: { username: string; role: string; exp?: number }) => Promise<string>
  ): Promise<AuthServiceResult> {
    try {
      const result = await this.refreshTokenUseCase.execute(refreshToken);

      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Token refresh failed',
        };
      }

      const exp = calculateTokenExpiration(env.JWT_ACCESS_TOKEN_EXPIRES_IN);
      const token = await jwtSign({
        username: result.user.username,
        role: result.user.role,
        ...(exp !== undefined && { exp }),
      });

      // Generate new refresh token (rotate)
      const newRefreshToken = await this.createRefreshToken(result.user.id);

      return {
        success: true,
        token,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Token refresh service error',
      };
    }
  }
}
