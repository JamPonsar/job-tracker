import { Router } from 'express';
import asyncHandler from '../asyncHandler.js';
import {
  checkCredentials,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '../auth.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!checkCredentials(username || '', password || '')) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  res.cookie(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  res.json({ ok: true });
}));

router.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get('/session', (req, res) => {
  res.json({ authenticated: verifySessionToken(req.cookies?.[SESSION_COOKIE]) });
});

export default router;
