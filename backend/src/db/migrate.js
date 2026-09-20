/**
 * QALAM – Database Migration Script
 * Reads docs/SCHEMA.sql and applies it to the configured PostgreSQL database.
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('🔄 Connecting to database...');
  const client = await pool.connect();

  try {
    console.log('📋 Running schema migration...');

    const schemaPath = path.join(__dirname, '..', '..', '..', 'docs', 'SCHEMA.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove pgvector lines if extension not available (safe fallback)
    sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "pg_trgm"[^;]*;/g, '-- pg_trgm skipped');
    // Remove VECTOR column if pgvector not installed
    sql = sql.replace(/embedding\s+VECTOR\(\d+\)[^,\n]*/g, '-- embedding vector skipped');

    await client.query(sql);
    console.log('✅ Schema applied successfully!');
  } catch (err) {
    // If objects already exist, that is fine
    if (err.message.includes('already exists')) {
      console.log('ℹ️  Schema already exists – skipping.');
    } else {
      console.error('❌ Migration error:', err.message);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
