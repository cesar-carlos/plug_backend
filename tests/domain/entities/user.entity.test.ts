import { describe, test, expect } from 'bun:test';
import { User } from '../../../src/domain/entities/user.entity';

describe('User Entity', () => {
  test('should create user with all properties', () => {
    const user = new User('1', 'testuser', 'hashedPassword123', 'user');

    expect(user.id).toBe('1');
    expect(user.username).toBe('testuser');
    expect(user.hashedPassword).toBe('hashedPassword123');
    expect(user.role).toBe('user');
  });

  test('hasRole should return true when user has the role', () => {
    const user = new User('1', 'admin', 'hash', 'admin');

    expect(user.hasRole('admin')).toBe(true);
  });

  test('hasRole should return false when user does not have the role', () => {
    const user = new User('1', 'user', 'hash', 'user');

    expect(user.hasRole('admin')).toBe(false);
  });

  test('isAdmin should return true when user is admin', () => {
    const user = new User('1', 'admin', 'hash', 'admin');

    expect(user.isAdmin()).toBe(true);
  });

  test('isAdmin should return false when user is not admin', () => {
    const user = new User('1', 'user', 'hash', 'user');

    expect(user.isAdmin()).toBe(false);
  });
});
