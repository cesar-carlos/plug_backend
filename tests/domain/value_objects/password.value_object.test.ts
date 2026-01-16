import { describe, test, expect } from 'bun:test';
import { Password } from '../../../src/domain/value_objects/password.value_object';

describe('Password Value Object', () => {
  test('should create valid password', () => {
    const password = Password.create('ValidPass123');

    expect(password.value).toBe('ValidPass123');
  });

  test('should throw error when password is empty', () => {
    expect(() => {
      Password.create('');
    }).toThrow('Password cannot be empty');
  });

  test('should throw error when password is too short', () => {
    expect(() => {
      Password.create('Short1');
    }).toThrow('Password must be at least 8 characters long');
  });

  test('should throw error when password is too long', () => {
    const longPassword = 'A'.repeat(129);

    expect(() => {
      Password.create(longPassword);
    }).toThrow('Password must not exceed 128 characters');
  });

  test('should throw error when password lacks uppercase', () => {
    expect(() => {
      Password.create('lowercase123');
    }).toThrow('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  });

  test('should throw error when password lacks lowercase', () => {
    expect(() => {
      Password.create('UPPERCASE123');
    }).toThrow('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  });

  test('should throw error when password lacks number', () => {
    expect(() => {
      Password.create('NoNumberHere');
    }).toThrow('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  });

  test('should accept valid password with all requirements', () => {
    expect(() => {
      Password.create('ValidPass123');
    }).not.toThrow();
  });

  test('equals should return true for same password', () => {
    const password1 = Password.create('ValidPass123');
    const password2 = Password.create('ValidPass123');

    expect(password1.equals(password2)).toBe(true);
  });
});
