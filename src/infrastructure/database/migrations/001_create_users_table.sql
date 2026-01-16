-- Migration: Create users table
-- Description: Initial migration to create the users table for authentication

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
