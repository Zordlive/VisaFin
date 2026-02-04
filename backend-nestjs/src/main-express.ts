import { startServer } from './express.server';

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
