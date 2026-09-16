import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required (a Postgres connection string).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

async function ensureColumn(table, column, definition) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

let readyPromise = null;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      profile_id INTEGER,
      date_applied TEXT NOT NULL,
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      location TEXT DEFAULT '',
      work_mode TEXT DEFAULT '',
      salary_range TEXT DEFAULT '',
      job_link TEXT DEFAULT '',
      applied INTEGER NOT NULL DEFAULT 0,
      result TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      profile_id INTEGER,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      application_id INTEGER,
      company TEXT,
      job_title TEXT
    );
  `);

  await ensureColumn('profiles', 'theme', "TEXT NOT NULL DEFAULT 'light'");

  // Migrating an existing single-profile database: make sure at least one
  // profile exists, and backfill any pre-existing rows onto it so old data
  // isn't orphaned once profile scoping is enforced.
  const { rows: existing } = await pool.query('SELECT * FROM profiles ORDER BY id ASC LIMIT 1');
  let defaultProfile = existing[0];
  if (!defaultProfile) {
    const { rows } = await pool.query(
      'INSERT INTO profiles (name, created_at) VALUES ($1, $2) RETURNING *',
      ['Default', new Date().toISOString()]
    );
    defaultProfile = rows[0];
  }
  await pool.query('UPDATE applications SET profile_id = $1 WHERE profile_id IS NULL', [defaultProfile.id]);
  await pool.query('UPDATE history SET profile_id = $1 WHERE profile_id IS NULL', [defaultProfile.id]);
}

export function ready() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

export default pool;
