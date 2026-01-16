import type { RefreshTokenRepository } from "../repositories/refresh_token_repository.interface";
import type { UserRepository } from "../repositories/user_repository.interface";
import type { User } from "../entities/user.entity";

export interface RefreshTokenResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenResult> {
    const tokenEntity = await this.refreshTokenRepository.findByToken(
      refreshToken
    );

    if (!tokenEntity) {
      return {
        success: false,
        error: "Invalid refresh token",
      };
    }

    if (!tokenEntity.isValid()) {
      return {
        success: false,
        error: "Refresh token expired or revoked",
      };
    }

    const user = await this.userRepository.findById(tokenEntity.userId);
    if (!user) {
      await this.refreshTokenRepository.revokeToken(refreshToken);
      return {
        success: false,
        error: "User not found",
      };
    }

    await this.refreshTokenRepository.revokeToken(refreshToken);

    return {
      success: true,
      user,
    };
  }
}
