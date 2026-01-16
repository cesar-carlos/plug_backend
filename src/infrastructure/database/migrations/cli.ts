#!/usr/bin/env bun

/**
 * Migration CLI Tool
 * 
 * Usage:
 *   bun run src/infrastructure/database/migrations/cli.ts status
 *   bun run src/infrastructure/database/migrations/cli.ts migrate
 *   bun run src/infrastructure/database/migrations/cli.ts info <migration_name>
 */

import { MigrationManager } from './migration_manager';
import { logger } from '../../../shared/utils/logger';

const command = process.argv[2];
const migrationName = process.argv[3];

const manager = new MigrationManager();

async function showStatus(): Promise<void> {
  const status = manager.getStatus();

  console.log('\n📊 Migration Status\n');
  console.log(`Total: ${status.total}`);
  console.log(`Applied: ${status.applied} ✅`);
  console.log(`Pending: ${status.pending} ⏳\n`);

  if (status.migrations.length === 0) {
    console.log('No migrations found.\n');
    return;
  }

  console.log('Migrations:');
  console.log('─'.repeat(80));

  for (const migration of status.migrations) {
    const statusIcon = migration.applied ? '✅' : '⏳';
    const appliedAt = migration.appliedAt
      ? new Date(migration.appliedAt).toLocaleString()
      : 'Not applied';

    console.log(
      `${statusIcon} ${migration.name.padEnd(40)} ${migration.applied ? appliedAt : 'Pending'}`
    );
  }

  console.log('─'.repeat(80));
  console.log();
}

async function runMigrations(): Promise<void> {
  console.log('\n🔄 Running migrations...\n');

  try {
    await manager.applyPending();
    console.log('\n✅ Migrations completed successfully!\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

async function showMigrationInfo(): Promise<void> {
  if (!migrationName) {
    console.error('❌ Error: Migration name is required');
    console.log('Usage: bun run src/infrastructure/database/migrations/cli.ts info <migration_name>');
    process.exit(1);
  }

  const info = manager.getMigrationDetails(migrationName);

  if (!info) {
    console.error(`❌ Migration "${migrationName}" not found`);
    process.exit(1);
  }

  console.log('\n📄 Migration Information\n');
  console.log(`Name: ${info.name}`);
  console.log(`Filename: ${info.filename}`);
  console.log(`Status: ${info.applied ? '✅ Applied' : '⏳ Pending'}`);
  if (info.appliedAt) {
    console.log(`Applied At: ${new Date(info.appliedAt).toLocaleString()}`);
  }
  console.log();
}

async function main(): Promise<void> {
  try {
    switch (command) {
      case 'status':
        await showStatus();
        break;

      case 'migrate':
        await runMigrations();
        break;

      case 'info':
        await showMigrationInfo();
        break;

      default:
        console.log('📦 Migration CLI Tool\n');
        console.log('Usage:');
        console.log('  bun run src/infrastructure/database/migrations/cli.ts status   - Show migration status');
        console.log('  bun run src/infrastructure/database/migrations/cli.ts migrate   - Apply pending migrations');
        console.log('  bun run src/infrastructure/database/migrations/cli.ts info <name> - Show migration details');
        console.log();
        process.exit(1);
    }
  } catch (err) {
    logger.error({ err }, 'CLI error');
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();
