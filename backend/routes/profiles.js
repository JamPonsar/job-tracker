import { Router } from 'express';
import pool from '../db.js';
import asyncHandler from '../asyncHandler.js';

const router = Router();

const VALID_THEMES = ['light', 'dark', 'pastel-pink', 'pastel-blue', 'pastel-purple'];

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles ORDER BY id ASC');
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Profile name is required.' });

  const { rows: existing } = await pool.query('SELECT * FROM profiles WHERE name = $1', [name]);
  if (existing[0]) return res.status(409).json({ error: 'A profile with that name already exists.' });

  const { rows } = await pool.query(
    'INSERT INTO profiles (name, created_at) VALUES ($1, $2) RETURNING *',
    [name, new Date().toISOString()]
  );
  res.status(201).json(rows[0]);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows: existingRows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Profile not found.' });

  const hasName = req.body?.name !== undefined;
  const hasTheme = req.body?.theme !== undefined;
  if (!hasName && !hasTheme) return res.status(400).json({ error: 'Nothing to update.' });

  let name = existing.name;
  if (hasName) {
    name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Profile name is required.' });

    const { rows: duplicate } = await pool.query('SELECT * FROM profiles WHERE name = $1 AND id != $2', [name, id]);
    if (duplicate[0]) return res.status(409).json({ error: 'A profile with that name already exists.' });
  }

  let theme = existing.theme;
  if (hasTheme) {
    theme = req.body.theme;
    if (!VALID_THEMES.includes(theme)) return res.status(400).json({ error: 'Invalid theme.' });
  }

  const { rows } = await pool.query(
    'UPDATE profiles SET name = $1, theme = $2 WHERE id = $3 RETURNING *',
    [name, theme, id]
  );
  res.json(rows[0]);
}));

export default router;
