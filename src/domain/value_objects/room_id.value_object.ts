export class RoomId {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 50;
  private static readonly ALLOWED_PATTERN = /^[a-zA-Z0-9_-]+$/;

  private constructor(public readonly value: string) {}

  static create(value: string): RoomId {
    const trimmed = value.trim();

    if (!trimmed || trimmed.length === 0) {
      throw new Error("Room ID cannot be empty");
    }

    if (trimmed.length < RoomId.MIN_LENGTH) {
      throw new Error(
        `Room ID must be at least ${RoomId.MIN_LENGTH} character long`
      );
    }

    if (trimmed.length > RoomId.MAX_LENGTH) {
      throw new Error(
        `Room ID must not exceed ${RoomId.MAX_LENGTH} characters`
      );
    }

    if (!RoomId.ALLOWED_PATTERN.test(trimmed)) {
      throw new Error(
        "Room ID can only contain letters, numbers, underscores, and hyphens"
      );
    }

    return new RoomId(trimmed);
  }

  equals(other: RoomId): boolean {
    return this.value === other.value;
  }
}
