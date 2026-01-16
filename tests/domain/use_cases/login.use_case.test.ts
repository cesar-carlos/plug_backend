import { describe, test, expect, beforeEach } from 'bun:test';
import { LoginUseCase } from '../../../src/domain/use_cases/login.use_case';
import { User } from '../../../src/domain/entities/user.entity';
import type { UserRepository } from '../../../src/domain/repositories/user_repository.interface';
import type { PasswordHasher } from '../../../src/shared/utils/password_hasher.interface';

class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private usersById: Map<string, User> = new Map();

  async findByUsername(username: string): Promise<User | null> {
    return this.users.get(username) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) || null;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.username, user);
    this.usersById.set(user.id, user);
    return user;
  }

  setUser(user: User): void {
    this.users.set(user.username, user);
    this.usersById.set(user.id, user);
  }
}

class MockPasswordHasher implements PasswordHasher {
  private passwordMap: Map<string, string> = new Map();

  async hash(password: string): Promise<string> {
    const hashed = `hashed_${password}`;
    this.passwordMap.set(password, hashed);
    return hashed;
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    const expectedHash = this.passwordMap.get(password);
    return expectedHash === hashedPassword;
  }

  setPasswordHash(password: string, hash: string): void {
    this.passwordMap.set(password, hash);
  }
}

describe('LoginUseCase', () => {
  let userRepository: MockUserRepository;
  let passwordHasher: MockPasswordHasher;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    passwordHasher = new MockPasswordHasher();
    loginUseCase = new LoginUseCase(userRepository, passwordHasher);
  });

  test('should return success when credentials are valid', async () => {
    const hashedPassword = await passwordHasher.hash('password123');
    const user = new User('1', 'testuser', hashedPassword, 'user');
    userRepository.setUser(user);

    const result = await loginUseCase.execute('testuser', 'password123');

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.username).toBe('testuser');
    expect(result.error).toBeUndefined();
  });

  test('should return error when user does not exist', async () => {
    const result = await loginUseCase.execute('nonexistent', 'password123');

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.error).toBe('Invalid credentials');
  });

  test('should return error when password is incorrect', async () => {
    const hashedPassword = await passwordHasher.hash('correctPassword');
    const user = new User('1', 'testuser', hashedPassword, 'user');
    userRepository.setUser(user);

    const result = await loginUseCase.execute('testuser', 'wrongPassword');

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.error).toBe('Invalid credentials');
  });
});
