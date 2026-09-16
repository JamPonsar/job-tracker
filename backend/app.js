import express from 'express';
import cors from 'cors';
import applicationsRouter from './routes/applications.js';
import historyRouter from './routes/history.js';
import profilesRouter from './routes/profiles.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// The frontend sends the active profile on every request via this header;
// /api/profiles itself is profile-agnostic (it lists/creates profiles).
app.use((req, res, next) => {
  const id = Number(req.header('x-profile-id'));
  req.profileId = Number.isInteger(id) && id > 0 ? id : null;
  next();
});

app.use('/api/profiles', profilesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/history', historyRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Catches errors thrown (sync or via next(err)) anywhere in the routes above,
// logs the full stack to the backend terminal, and returns JSON instead of
// Express's default HTML error page so the frontend can show something useful.
app.use((err, req, res, next) => {
  console.error(`Error handling ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
