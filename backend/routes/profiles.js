import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY id ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Profile name is required.' });

  const existing = db.prepare('SELECT * FROM profiles WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'A profile with that name already exists.' });

  const info = db
    .prepare('INSERT INTO profiles (name, created_at) VALUES (?, ?)')
    .run(name, new Date().toISOString());
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Profile name is required.' });

  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Profile not found.' });

  const duplicate = db.prepare('SELECT * FROM profiles WHERE name = ? AND id != ?').get(name, id);
  if (duplicate) return res.status(409).json({ error: 'A profile with that name already exists.' });

  db.prepare('UPDATE profiles SET name = ? WHERE id = ?').run(name, id);
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  res.json(row);
});

export default router;
