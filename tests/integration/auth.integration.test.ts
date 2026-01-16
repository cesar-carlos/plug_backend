import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { InMemoryUserRepository } from '../../src/infrastructure/repositories/in_memory_user.repository';
import { BcryptPasswordHasher } from '../../src/shared/utils/bcrypt_password_hasher';
import { LoginUseCase } from '../../src/domain/use_cases/login.use_case';
import { AuthService } from '../../src/application/services/auth.service';

describe('Auth Integration Tests', () => {
  let userRepository: InMemoryUserRepository;
  let passwordHasher: BcryptPasswordHasher;
  let loginUseCase: LoginUseCase;
  let authService: AuthService;

  beforeAll(() => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new BcryptPasswordHasher();
    loginUseCase = new LoginUseCase(userRepository, passwordHasher);
    authService = new AuthService(loginUseCase);
  });

  test('should authenticate user with bcrypt password hashing', async () => {
    const testPassword = 'TestPassword123';
    const hashedPassword = await passwordHasher.hash(testPassword);

    const adminUser = await userRepository.findByUsername('admin');
    if (!adminUser && userRepository.setUserPassword) {
      await userRepository.setUserPassword('admin', hashedPassword);
    } else if (adminUser && userRepository.setUserPassword) {
      await userRepository.setUserPassword('admin', hashedPassword);
    } else {
      throw new Error('setUserPassword method not available');
    }

    const mockJwtSign = async (payload: { username: string; role: string }): Promise<string> => {
      return `token_${payload.username}_${payload.role}`;
    };

    const result = await authService.login('admin', testPassword, mockJwtSign);

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  test('should fail authentication with wrong password', async () => {
    const testPassword = 'correctPassword';
    const hashedPassword = await passwordHasher.hash(testPassword);

    if (userRepository.setUserPassword) {
      await userRepository.setUserPassword('admin', hashedPassword);
    }

    const mockJwtSign = async (): Promise<string> => {
      return 'token';
    };

    const result = await authService.login('admin', 'wrongPassword', mockJwtSign);

    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
