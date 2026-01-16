export class Username {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 30;
  private static readonly ALLOWED_PATTERN = /^[a-zA-Z0-9_-]+$/;

  private constructor(public readonly value: string) {}

  static create(value: string): Username {
    const trimmed = value.trim();

    if (!trimmed || trimmed.length === 0) {
      throw new Error("Username cannot be empty");
    }

    if (trimmed.length < Username.MIN_LENGTH) {
      throw new Error(
        `Username must be at least ${Username.MIN_LENGTH} characters long`
      );
    }

    if (trimmed.length > Username.MAX_LENGTH) {
      throw new Error(
        `Username must not exceed ${Username.MAX_LENGTH} characters`
      );
    }

    if (!Username.ALLOWED_PATTERN.test(trimmed)) {
      throw new Error(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    }

    return new Username(trimmed);
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
