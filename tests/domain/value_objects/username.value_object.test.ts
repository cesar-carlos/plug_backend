import { describe, test, expect } from 'bun:test';
import { Username } from '../../../src/domain/value_objects/username.value_object';

describe('Username Value Object', () => {
  test('should create valid username', () => {
    const username = Username.create('testuser');

    expect(username.value).toBe('testuser');
  });

  test('should trim whitespace', () => {
    const username = Username.create('  testuser  ');

    expect(username.value).toBe('testuser');
  });

  test('should throw error when username is empty', () => {
    expect(() => {
      Username.create('');
    }).toThrow('Username cannot be empty');
  });

  test('should throw error when username is too short', () => {
    expect(() => {
      Username.create('ab');
    }).toThrow('Username must be at least 3 characters long');
  });

  test('should throw error when username is too long', () => {
    const longUsername = 'a'.repeat(31);

    expect(() => {
      Username.create(longUsername);
    }).toThrow('Username must not exceed 30 characters');
  });

  test('should throw error when username contains invalid characters', () => {
    expect(() => {
      Username.create('test user');
    }).toThrow('Username can only contain letters, numbers, underscores, and hyphens');

    expect(() => {
      Username.create('test@user');
    }).toThrow('Username can only contain letters, numbers, underscores, and hyphens');
  });

  test('should accept valid characters', () => {
    expect(() => {
      Username.create('test_user-123');
    }).not.toThrow();
  });

  test('equals should return true for same username', () => {
    const username1 = Username.create('testuser');
    const username2 = Username.create('testuser');

    expect(username1.equals(username2)).toBe(true);
  });

  test('equals should return false for different usernames', () => {
    const username1 = Username.create('testuser1');
    const username2 = Username.create('testuser2');

    expect(username1.equals(username2)).toBe(false);
  });
});
