import { Database as SQLiteDatabase } from 'bun:sqlite';
import { logger } from '../../shared/utils/logger';
import { env } from '../../shared/config/env';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const DEFAULT_DB_PATH = './data/plug_backend.db';

const SQLITE_PRAGMAS = {
  FOREIGN_KEYS: 'PRAGMA foreign_keys = ON;',
  JOURNAL_MODE_WAL: 'PRAGMA journal_mode = WAL;',
  SYNCHRONOUS_NORMAL: 'PRAGMA synchronous = NORMAL;',
} as const;

const isDirectoryExistsError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('EEXIST');
  }
  const nodeError = error as NodeJS.ErrnoException;
  return nodeError.code === 'EEXIST';
};

const ensureDirectoryExists = (dirPath: string): void => {
  try {
    mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    if (!isDirectoryExistsError(error)) {
      throw error;
    }
  }
};

export class Database {
  private static instance: Database | null = null;
  private db: SQLiteDatabase;

  private constructor() {
    const dbPath = resolve(env.DATABASE_PATH || DEFAULT_DB_PATH);
    
    try {
      const dbDir = dirname(dbPath);
      ensureDirectoryExists(dbDir);

      this.db = new SQLiteDatabase(dbPath);
      
      this.db.exec(SQLITE_PRAGMAS.FOREIGN_KEYS);
      this.db.exec(SQLITE_PRAGMAS.JOURNAL_MODE_WAL);
      this.db.exec(SQLITE_PRAGMAS.SYNCHRONOUS_NORMAL);
      
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
