import { MigrationManager } from './migration_manager';

/**
 * Run all pending migrations
 * This is the main entry point for migrations on server startup
 */
export const runMigrations = async (): Promise<void> => {
  const manager = new MigrationManager();
  await manager.runMigrations();
};

/**
 * Get migration status
 */
export const getMigrationStatus = () => {
  const manager = new MigrationManager();
  return manager.getStatus();
};
