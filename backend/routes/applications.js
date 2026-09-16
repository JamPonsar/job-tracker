import { Router } from 'express';
import pool from '../db.js';
import asyncHandler from '../asyncHandler.js';

const router = Router();

const EDITABLE_FIELDS = [
  'date_applied',
  'company',
  'job_title',
  'location',
  'work_mode',
  'salary_range',
  'job_link',
  'applied',
  'result',
  'notes',
];

function toApi(row) {
  return { ...row, applied: Boolean(row.applied) };
}

async function logHistory(profileId, eventType, applicationId, company, jobTitle) {
  await pool.query(
    `INSERT INTO history (profile_id, event_type, timestamp, application_id, company, job_title) VALUES ($1, $2, $3, $4, $5, $6)`,
    [profileId, eventType, new Date().toISOString(), applicationId, company, jobTitle]
  );
}

router.use((req, res, next) => {
  if (!req.profileId) return res.status(400).json({ error: 'Missing or invalid X-Profile-Id header.' });
  next();
});

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM applications WHERE deleted_at IS NULL AND profile_id = $1 ORDER BY date_applied DESC, id DESC',
    [req.profileId]
  );
  res.json(rows.map(toApi));
}));

// Per-day counts for the activity heatmap, keyed by date_applied (the date
// the user says they applied, not when the row was created). An application
// deleted on the same calendar day it was created is excluded entirely —
// treated as a fake/duplicate entry rather than a real, later withdrawal.
router.get('/activity', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT date_applied AS day, COUNT(*) AS count
     FROM applications
     WHERE profile_id = $1
       AND (deleted_at IS NULL OR deleted_at::date != created_at::date)
     GROUP BY date_applied`,
    [req.profileId]
  );
  res.json(rows.map((r) => ({ ...r, count: Number(r.count) })));
}));

router.post('/', asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!b.company?.trim() || !b.job_title?.trim()) {
    return res.status(400).json({ error: 'Company name and job title are required.' });
  }

  const now = new Date().toISOString();
  const applied = Boolean(b.applied);
  const defaultResult = applied ? 'Waiting to hear back' : 'Not yet applied';

  const { rows } = await pool.query(
    `INSERT INTO applications
      (profile_id, date_applied, company, job_title, location, work_mode, salary_range, job_link, applied, result, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      req.profileId,
      b.date_applied || now.slice(0, 10),
      b.company.trim(),
      b.job_title.trim(),
      b.location || '',
      b.work_mode || '',
      b.salary_range || '',
      b.job_link || '',
      applied ? 1 : 0,
      b.result || defaultResult,
      b.notes || '',
      now,
    ]
  );

  await logHistory(req.profileId, 'added', rows[0].id, b.company.trim(), b.job_title.trim());

  res.status(201).json(toApi(rows[0]));
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows: existingRows } = await pool.query(
    'SELECT * FROM applications WHERE id = $1 AND deleted_at IS NULL AND profile_id = $2',
    [id, req.profileId]
  );
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'applied' ? (req.body[field] ? 1 : 0) : req.body[field];
    }
  }

  if (Object.keys(updates).length > 0) {
    const keys = Object.keys(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => updates[key]);
    await pool.query(`UPDATE applications SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, id]);
  }

  const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
  res.json(toApi(rows[0]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows: existingRows } = await pool.query(
    'SELECT * FROM applications WHERE id = $1 AND deleted_at IS NULL AND profile_id = $2',
    [id, req.profileId]
  );
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  await pool.query('UPDATE applications SET deleted_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
  await logHistory(req.profileId, 'deleted', id, existing.company, existing.job_title);

  res.json({ ok: true });
}));

router.post('/:id/restore', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows: existingRows } = await pool.query(
    'SELECT * FROM applications WHERE id = $1 AND deleted_at IS NOT NULL AND profile_id = $2',
    [id, req.profileId]
  );
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Deleted application not found.' });

  await pool.query('UPDATE applications SET deleted_at = NULL WHERE id = $1', [id]);
  await logHistory(req.profileId, 'undo', id, existing.company, existing.job_title);

  const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
  res.json(toApi(rows[0]));
}));

export default router;
