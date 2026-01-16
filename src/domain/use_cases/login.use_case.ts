import type { UserRepository } from "../repositories/user_repository.interface";
import type { User } from "../entities/user.entity";
import type { PasswordHasher } from "../../shared/utils/password_hasher.interface";

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(username: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.hashedPassword
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    return {
      success: true,
      user,
    };
  }
}
