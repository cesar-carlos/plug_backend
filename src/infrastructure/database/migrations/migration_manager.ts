import { Database } from "../database";
import { logger } from "../../../shared/utils/logger";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, basename, extname } from "path";

export interface MigrationInfo {
  name: string;
  filename: string;
  applied: boolean;
  appliedAt?: string;
}

export interface MigrationStatus {
  total: number;
  applied: number;
  pending: number;
  migrations: MigrationInfo[];
}

export class MigrationManager {
  private db = Database.getInstance().getConnection();
  private migrationsDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    this.migrationsDir = dirname(__filename);
  }

  /**
   * Initialize migrations table with enhanced tracking
   */
  private initializeMigrationsTable(): void {
    // Create table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now')),
        execution_time_ms INTEGER,
        checksum TEXT
      );
    `);

    // Migrate existing table structure if needed (for backward compatibility)
    try {
      // Check if filename column exists
      const tableInfo = this.db
        .prepare("PRAGMA table_info(migrations)")
        .all() as Array<{
        name: string;
        type: string;
      }>;

      const hasFilename = tableInfo.some((col) => col.name === "filename");

      if (!hasFilename) {
        logger.info("Migrating migrations table to new format");

        // Add new columns
        this.db.exec("ALTER TABLE migrations ADD COLUMN filename TEXT;");
        this.db.exec(
          "ALTER TABLE migrations ADD COLUMN execution_time_ms INTEGER;"
        );
        this.db.exec("ALTER TABLE migrations ADD COLUMN checksum TEXT;");

        // Update existing records: set filename = name (for backward compatibility)
        this.db.exec(
          "UPDATE migrations SET filename = name WHERE filename IS NULL;"
        );

        logger.info("Migrations table migrated successfully");
      }
    } catch (err) {
      // If migration fails, it might be because columns already exist or table doesn't exist yet
      logger.debug({ err }, "Table migration check completed");
    }
  }

  /**
   * Get all migration files from the migrations directory
   */
  private getMigrationFiles(): string[] {
    try {
      const files = readdirSync(this.migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort(); // Sort alphabetically/numerically

      return files;
    } catch (err) {
      logger.error(
        { err, dir: this.migrationsDir },
        "Failed to read migrations directory"
      );
      throw new Error(`Failed to read migrations directory: ${err}`);
    }
  }

  /**
   * Get applied migrations from database
   */
  private getAppliedMigrations(): Map<
    string,
    { appliedAt: string; filename: string }
  > {
    const applied = new Map<string, { appliedAt: string; filename: string }>();

    try {
      const stmt = this.db.prepare(
        "SELECT name, filename, applied_at FROM migrations"
      );
      const rows = stmt.all() as Array<{
        name: string;
        filename: string;
        applied_at: string;
      }>;

      for (const row of rows) {
        applied.set(row.name, {
          appliedAt: row.applied_at,
          filename: row.filename,
        });
      }
    } catch (err) {
      // Table might not exist yet, return empty map
      logger.debug(
        { err },
        "Could not read applied migrations (table may not exist)"
      );
    }

    return applied;
  }

  /**
   * Get migration status (applied vs pending)
   */
  public getStatus(): MigrationStatus {
    this.initializeMigrationsTable();

    const files = this.getMigrationFiles();
    const applied = this.getAppliedMigrations();

    const migrations: MigrationInfo[] = files.map((filename) => {
      const name = basename(filename, extname(filename));
      const appliedInfo = applied.get(name);

      return {
        name,
        filename,
        applied: !!appliedInfo,
        appliedAt: appliedInfo?.appliedAt,
      };
    });

    const appliedCount = migrations.filter((m) => m.applied).length;
    const pendingCount = migrations.length - appliedCount;

    return {
      total: migrations.length,
      applied: appliedCount,
      pending: pendingCount,
      migrations,
    };
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(filename: string): Promise<void> {
    const name = basename(filename, extname(filename));
    const migrationPath = join(this.migrationsDir, filename);

    try {
      const startTime = Date.now();
      const migrationSQL = readFileSync(migrationPath, "utf-8");

      logger.info({ migration: name }, "Applying migration");

      // Execute migration in a transaction
      this.db.exec("BEGIN TRANSACTION;");
      try {
        this.db.exec(migrationSQL);

        // Record migration as applied
        const executionTime = Date.now() - startTime;
        const insertStmt = this.db.prepare(
          "INSERT INTO migrations (name, filename, execution_time_ms) VALUES (?, ?, ?)"
        );
        insertStmt.run(name, filename, executionTime);

        this.db.exec("COMMIT;");
        logger.info(
          { migration: name, executionTimeMs: executionTime },
          "Migration applied successfully"
        );
      } catch (err) {
        this.db.exec("ROLLBACK;");
        throw err;
      }
    } catch (err) {
      logger.error({ err, migration: name }, "Failed to apply migration");
      throw new Error(`Migration ${name} failed: ${err}`);
    }
  }

  /**
   * Apply all pending migrations
   */
  public async applyPending(): Promise<void> {
    this.initializeMigrationsTable();

    const status = this.getStatus();
    const pendingMigrations = status.migrations.filter((m) => !m.applied);

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations to apply");
      return;
    }

    logger.info(
      { count: pendingMigrations.length },
      "Applying pending migrations"
    );

    for (const migration of pendingMigrations) {
      await this.applyMigration(migration.filename);
    }

    logger.info(
      { count: pendingMigrations.length },
      "All pending migrations applied"
    );
  }

  /**
   * Apply all migrations (used on server startup)
   */
  public async runMigrations(): Promise<void> {
    await this.applyPending();
  }

  /**
   * Get detailed migration information
   */
  public getMigrationDetails(name: string): MigrationInfo | null {
    const status = this.getStatus();
    return status.migrations.find((m) => m.name === name) || null;
  }
}
