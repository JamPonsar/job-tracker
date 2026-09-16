import app from '../app.js';
import { ready } from '../db.js';

export default async function handler(req, res) {
  await ready();
  app(req, res);
}
