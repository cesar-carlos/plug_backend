import type { UserRepository } from "../../domain/repositories/user_repository.interface";
import { User } from "../../domain/entities/user.entity";
import { Database } from "../database/database";
import { USER_ROLES } from "../../shared/constants/user_roles";

export class SQLiteUserRepository implements UserRepository {
  private db = Database.getInstance().getConnection();
  private _findByUsernameStmt: ReturnType<typeof this.db.prepare> | null = null;
  private _findByIdStmt: ReturnType<typeof this.db.prepare> | null = null;
  private _insertUserStmt: ReturnType<typeof this.db.prepare> | null = null;
  private _updateUserPasswordStmt: ReturnType<typeof this.db.prepare> | null =
    null;
  private _userExistsStmt: ReturnType<typeof this.db.prepare> | null = null;

  private get findByUsernameStmt() {
    if (!this._findByUsernameStmt) {
      this._findByUsernameStmt = this.db.prepare(
        "SELECT * FROM users WHERE username = ?"
      );
    }
    return this._findByUsernameStmt;
  }

  private get findByIdStmt() {
    if (!this._findByIdStmt) {
      this._findByIdStmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    }
    return this._findByIdStmt;
  }

  private get insertUserStmt() {
    if (!this._insertUserStmt) {
      this._insertUserStmt = this.db.prepare(
        "INSERT INTO users (id, username, hashed_password, role) VALUES (?, ?, ?, ?)"
      );
    }
    return this._insertUserStmt;
  }

  private get updateUserPasswordStmt() {
    if (!this._updateUserPasswordStmt) {
      this._updateUserPasswordStmt = this.db.prepare(
        'UPDATE users SET hashed_password = ?, updated_at = datetime("now") WHERE username = ?'
      );
    }
    return this._updateUserPasswordStmt;
  }

  private get userExistsStmt() {
    if (!this._userExistsStmt) {
      this._userExistsStmt = this.db.prepare(
        "SELECT COUNT(*) as count FROM users WHERE username = ?"
      );
    }
    return this._userExistsStmt;
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = this.findByUsernameStmt.get(username) as
        | {
            id: string;
            username: string;
            hashed_password: string;
            role: string;
          }
        | undefined;

      if (!result) {
        return null;
      }

      return new User(
        result.id,
        result.username,
        result.hashed_password,
        result.role
      );
    } catch (err) {
      throw new Error(`Failed to find user by username: ${err}`);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = this.findByIdStmt.get(id) as
        | {
            id: string;
            username: string;
            hashed_password: string;
            role: string;
          }
        | undefined;

      if (!result) {
        return null;
      }

      return new User(
        result.id,
        result.username,
        result.hashed_password,
        result.role
      );
    } catch (err) {
      throw new Error(`Failed to find user by id: ${err}`);
    }
  }

  async create(user: User): Promise<User> {
    try {
      // Check if user already exists
      const existing = await this.findByUsername(user.username);
      if (existing) {
        throw new Error(`User with username ${user.username} already exists`);
      }

      // Insert new user
      this.insertUserStmt.run(
        user.id,
        user.username,
        user.hashedPassword,
        user.role
      );

      return user;
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        throw err;
      }
      throw new Error(`Failed to create user: ${err}`);
    }
  }

  async setUserPassword(
    username: string,
    hashedPassword: string
  ): Promise<void> {
    try {
      const existsResult = this.userExistsStmt.get(username) as
        | { count: number }
        | undefined;
      const exists = existsResult && existsResult.count > 0;

      if (exists) {
        // Update existing user
        const updateResult = this.updateUserPasswordStmt.run(
          hashedPassword,
          username
        );
        if (updateResult.changes === 0) {
          throw new Error(`Failed to update password for user: ${username}`);
        }
      } else {
        // Create new user
        const id = crypto.randomUUID();
        const role = USER_ROLES.ADMIN;
        this.insertUserStmt.run(id, username, hashedPassword, role);
      }
    } catch (err) {
      throw new Error(`Failed to set user password: ${err}`);
    }
  }
}
