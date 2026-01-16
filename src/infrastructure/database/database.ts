import { Database as SQLiteDatabase } from 'bun:sqlite';
import { logger } from '../../shared/utils/logger';
import { env } from '../../shared/config/env';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export class Database {
  private static instance: Database | null = null;
  private db: SQLiteDatabase;

  private constructor() {
    const dbPath = env.DATABASE_PATH || './data/plug_backend.db';
    
    try {
      // Ensure directory exists
      const dbDir = dirname(dbPath);
      mkdir(dbDir, { recursive: true }).catch(() => {
        // Directory might already exist, ignore error
      });

      this.db = new SQLiteDatabase(dbPath);
      this.db.exec('PRAGMA foreign_keys = ON;');
      logger.info({ dbPath }, 'SQLite database connected');
    } catch (err) {
      logger.fatal({ err, dbPath }, 'Failed to connect to SQLite database');
      throw err;
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getConnection(): SQLiteDatabase {
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      logger.info('SQLite database connection closed');
    }
  }
}
