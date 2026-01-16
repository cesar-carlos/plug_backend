export class Password {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  private constructor(public readonly value: string) {}

  static create(value: string): Password {
    if (!value || value.length === 0) {
      throw new Error("Password cannot be empty");
    }

    if (value.length < Password.MIN_LENGTH) {
      throw new Error(
        `Password must be at least ${Password.MIN_LENGTH} characters long`
      );
    }

    if (value.length > Password.MAX_LENGTH) {
      throw new Error(
        `Password must not exceed ${Password.MAX_LENGTH} characters`
      );
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new Error(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }

    return new Password(value);
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }
}
