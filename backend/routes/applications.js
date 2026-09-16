import { Router } from 'express';
import db from '../db.js';

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

function logHistory(profileId, eventType, applicationId, company, jobTitle) {
  db.prepare(
    `INSERT INTO history (profile_id, event_type, timestamp, application_id, company, job_title) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(profileId, eventType, new Date().toISOString(), applicationId, company, jobTitle);
}

router.use((req, res, next) => {
  if (!req.profileId) return res.status(400).json({ error: 'Missing or invalid X-Profile-Id header.' });
  next();
});

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM applications WHERE deleted_at IS NULL AND profile_id = ? ORDER BY date_applied DESC, id DESC')
    .all(req.profileId);
  res.json(rows.map(toApi));
});

// Per-day counts for the activity heatmap, keyed by date_applied (the date
// the user says they applied, not when the row was created). An application
// deleted on the same calendar day it was created is excluded entirely —
// treated as a fake/duplicate entry rather than a real, later withdrawal.
router.get('/activity', (req, res) => {
  const rows = db
    .prepare(
      `SELECT date_applied AS day, COUNT(*) AS count
       FROM applications
       WHERE profile_id = ?
         AND (deleted_at IS NULL OR date(deleted_at) != date(created_at))
       GROUP BY date_applied`
    )
    .all(req.profileId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.company?.trim() || !b.job_title?.trim()) {
    return res.status(400).json({ error: 'Company name and job title are required.' });
  }

  const now = new Date().toISOString();
  const applied = Boolean(b.applied);
  const defaultResult = applied ? 'Waiting to hear back' : 'Not yet applied';

  const info = db
    .prepare(
      `INSERT INTO applications
        (profile_id, date_applied, company, job_title, location, work_mode, salary_range, job_link, applied, result, notes, created_at)
       VALUES (@profile_id, @date_applied, @company, @job_title, @location, @work_mode, @salary_range, @job_link, @applied, @result, @notes, @created_at)`
    )
    .run({
      profile_id: req.profileId,
      date_applied: b.date_applied || now.slice(0, 10),
      company: b.company.trim(),
      job_title: b.job_title.trim(),
      location: b.location || '',
      work_mode: b.work_mode || '',
      salary_range: b.salary_range || '',
      job_link: b.job_link || '',
      applied: applied ? 1 : 0,
      result: b.result || defaultResult,
      notes: b.notes || '',
      created_at: now,
    });

  logHistory(req.profileId, 'added', info.lastInsertRowid, b.company.trim(), b.job_title.trim());

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(toApi(row));
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT * FROM applications WHERE id = ? AND deleted_at IS NULL AND profile_id = ?')
    .get(id, req.profileId);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'applied' ? (req.body[field] ? 1 : 0) : req.body[field];
    }
  }

  if (Object.keys(updates).length > 0) {
    const setClause = Object.keys(updates)
      .map((key) => `${key} = @${key}`)
      .join(', ');
    db.prepare(`UPDATE applications SET ${setClause} WHERE id = @id`).run({ ...updates, id });
  }

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.json(toApi(row));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT * FROM applications WHERE id = ? AND deleted_at IS NULL AND profile_id = ?')
    .get(id, req.profileId);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  db.prepare('UPDATE applications SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  logHistory(req.profileId, 'deleted', id, existing.company, existing.job_title);

  res.json({ ok: true });
});

router.post('/:id/restore', (req, res) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT * FROM applications WHERE id = ? AND deleted_at IS NOT NULL AND profile_id = ?')
    .get(id, req.profileId);
  if (!existing) return res.status(404).json({ error: 'Deleted application not found.' });

  db.prepare('UPDATE applications SET deleted_at = NULL WHERE id = ?').run(id);
  logHistory(req.profileId, 'undo', id, existing.company, existing.job_title);

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.json(toApi(row));
});

export default router;
