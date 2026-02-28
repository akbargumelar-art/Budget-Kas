-- Migration: Add 'input' role and activity_logs table
-- Run this migration on your MySQL database after deploying the updated code.

-- 1. Add 'input' value to the role ENUM column
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'viewer', 'input') NOT NULL DEFAULT 'viewer';

-- 2. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  action ENUM('add', 'edit', 'delete') NOT NULL,
  entityType VARCHAR(50) NOT NULL DEFAULT 'transaction',
  entityId VARCHAR(36) NOT NULL,
  details TEXT,
  userId VARCHAR(36) NOT NULL,
  userName VARCHAR(255) NOT NULL,
  walletId VARCHAR(36) NOT NULL,
  walletName VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_walletId (walletId),
  INDEX idx_createdAt (createdAt)
);
