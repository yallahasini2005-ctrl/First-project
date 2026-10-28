require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const supabase = require('./supabase');
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const requestRoutes = require('./routes/requests');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random secret of at least 32 characters in backend/.env');
}
const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"] } } }));
app.use(cors());
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
app.get('/api/health', async (_req, res) => {
  try {
    const { error } = await supabase.from('app_users').select('id', { head: true, count: 'exact' });
    if (error) throw error;
    res.json({ status: 'ok', database: 'connected' });
  } catch { res.status(503).json({ status: 'error', database: 'unavailable', message: 'Check Supabase configuration and schema.' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('*path', (_req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.use((err, _req, res, _next) => {
  console.error('Request failed:', err.message || err);
  res.status(500).json({ error: 'Something went wrong. Check the server configuration and try again.' });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Blood Donor System running at http://localhost:${port}`));
