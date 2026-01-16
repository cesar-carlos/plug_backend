import type { LoginUseCase, LoginResult } from '../../domain/use_cases/login.use_case';
import type { RegisterUseCase, RegisterResult } from '../../domain/use_cases/register.use_case';
import type { RefreshTokenUseCase } from '../../domain/use_cases/refresh_token.use_case';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh_token_repository.interface';
import type { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh_token.entity';
import { generateRefreshToken } from '../../shared/utils/token_generator';
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
    const expiresIn = env.JWT_REFRESH_TOKEN_EXPIRES_IN;
    
    // Parse expires in (e.g., "7d" = 7 days)
    let expiresAt: Date;
    if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1), 10);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    } else if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1), 10);
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
    } else if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn.slice(0, -1), 10);
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    } else {
      // Default to 7 days
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

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

      // Generate access token with expiration
      const accessTokenExpiresIn = env.JWT_ACCESS_TOKEN_EXPIRES_IN;
      let exp: number | undefined;
      if (accessTokenExpiresIn.endsWith('m')) {
        const minutes = parseInt(accessTokenExpiresIn.slice(0, -1), 10);
        exp = Math.floor(Date.now() / 1000) + minutes * 60;
      } else if (accessTokenExpiresIn.endsWith('h')) {
        const hours = parseInt(accessTokenExpiresIn.slice(0, -1), 10);
        exp = Math.floor(Date.now() / 1000) + hours * 60 * 60;
      }

      const token = await jwtSign({
        username: result.user.username,
        role: result.user.role,
        exp,
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

      // Generate access token with expiration
      const accessTokenExpiresIn = env.JWT_ACCESS_TOKEN_EXPIRES_IN;
      let exp: number | undefined;
      if (accessTokenExpiresIn.endsWith('m')) {
        const minutes = parseInt(accessTokenExpiresIn.slice(0, -1), 10);
        exp = Math.floor(Date.now() / 1000) + minutes * 60;
      } else if (accessTokenExpiresIn.endsWith('h')) {
        const hours = parseInt(accessTokenExpiresIn.slice(0, -1), 10);
        exp = Math.floor(Date.now() / 1000) + hours * 60 * 60;
      }

      const token = await jwtSign({
        username: result.user.username,
        role: result.user.role,
        exp,
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

      // Generate new access token
      const accessTokenExpiresIn = env.JWT_ACCESS_TOKEN_EXPIRES_IN;
      let exp: number | undefined;
      if (accessTokenExpiresIn.endsWith('m')) {
        const minutes = parseInt(accessTokenExpiresIn.slice(0, -1), 10);
        exp = Math.floor(Date.now() / 1000) + minutes * 60;
      } else if (accessTokenExpiresIn.endsWith('h')) {
        const hours = parseInt(accessTokenExpiresIn.slice(0, -1), 10);
        exp = Math.floor(Date.now() / 1000) + hours * 60 * 60;
      }

      const token = await jwtSign({
        username: result.user.username,
        role: result.user.role,
        exp,
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
