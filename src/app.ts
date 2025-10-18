import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import reportsRouter from './routes/reports';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', reportsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Auxeira API server running on port ${PORT}`);
  console.log(`📊 Reports API: http://localhost:${PORT}/api/reports`);
});

export default app;
