import type { UserRepository } from "../repositories/user_repository.interface";
import { User } from "../entities/user.entity";
import type { PasswordHasher } from "../../shared/utils/password_hasher.interface";

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(
    username: string,
    password: string,
    role: string = "user"
  ): Promise<RegisterResult> {
    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      return {
        success: false,
        error: "Username already exists",
      };
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    const id = crypto.randomUUID();
    const user = new User(id, username, hashedPassword, role);

    try {
      const createdUser = await this.userRepository.create(user);
      return {
        success: true,
        user: createdUser,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create user",
      };
    }
  }
}
