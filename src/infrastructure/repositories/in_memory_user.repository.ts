import type { UserRepository } from "../../domain/repositories/user_repository.interface";
import { User } from "../../domain/entities/user.entity";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    const defaultUserPassword = process.env.DEFAULT_ADMIN_PASSWORD;

    if (defaultUserPassword) {
      this.users.set("admin", new User("1", "admin", "", "admin"));
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = this.users.get(username);
    return user
      ? new User(user.id, user.username, user.hashedPassword, user.role)
      : null;
  }

  async findById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return new User(user.id, user.username, user.hashedPassword, user.role);
      }
    }
    return null;
  }

  async create(user: User): Promise<User> {
    // Check if user already exists
    if (this.users.has(user.username)) {
      throw new Error(`User with username ${user.username} already exists`);
    }

    this.users.set(user.username, user);
    return user;
  }

  async setUserPassword(
    username: string,
    hashedPassword: string
  ): Promise<void> {
    const user = this.users.get(username);
    if (user) {
      const updatedUser = new User(
        user.id,
        user.username,
        hashedPassword,
        user.role
      );
      this.users.set(username, updatedUser);
    } else {
      const newUser = new User("1", username, hashedPassword, "admin");
      this.users.set(username, newUser);
    }
  }
}
