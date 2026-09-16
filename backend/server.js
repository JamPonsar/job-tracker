import app from './app.js';
import { ready } from './db.js';

const PORT = process.env.PORT || 3001;

ready()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Job Applicator backend listening on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use — another backend instance is probably still running.`);
      } else {
        console.error('Failed to start backend server:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
