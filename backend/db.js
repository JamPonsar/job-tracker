import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'job_applicator.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    application_id INTEGER,
    company TEXT,
    job_title TEXT
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('applications', 'profile_id', 'INTEGER');
ensureColumn('history', 'profile_id', 'INTEGER');

// Migrating an existing single-profile database: make sure at least one
// profile exists, and backfill any pre-existing rows onto it so old data
// isn't orphaned once profile scoping is enforced.
let defaultProfile = db.prepare('SELECT * FROM profiles ORDER BY id ASC LIMIT 1').get();
if (!defaultProfile) {
  const info = db
    .prepare('INSERT INTO profiles (name, created_at) VALUES (?, ?)')
    .run('Default', new Date().toISOString());
  defaultProfile = { id: info.lastInsertRowid, name: 'Default' };
}
db.prepare('UPDATE applications SET profile_id = ? WHERE profile_id IS NULL').run(defaultProfile.id);
db.prepare('UPDATE history SET profile_id = ? WHERE profile_id IS NULL').run(defaultProfile.id);

export default db;
