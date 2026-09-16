import { Router } from 'express';
import pool from '../db.js';
import asyncHandler from '../asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  if (!req.profileId) return res.status(400).json({ error: 'Missing or invalid X-Profile-Id header.' });

  // currently_deleted tells the UI whether a "deleted" event's application is
  // still deleted right now (and therefore restorable) vs. already undone.
  const { rows } = await pool.query(
    `SELECT h.*, CASE WHEN a.id IS NOT NULL AND a.deleted_at IS NOT NULL THEN 1 ELSE 0 END AS currently_deleted
     FROM history h
     LEFT JOIN applications a ON a.id = h.application_id
     WHERE h.profile_id = $1
     ORDER BY h.timestamp DESC, h.id DESC`,
    [req.profileId]
  );
  res.json(rows.map((r) => ({ ...r, currently_deleted: Boolean(r.currently_deleted) })));
}));

export default router;
