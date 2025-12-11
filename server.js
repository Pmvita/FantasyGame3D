// Local development server
// Runs Express server to handle both static files and API endpoints
// For production, use Vercel deployment

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS middleware for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes - Import and use the serverless function handlers
// The handlers are already wrapped with CORS and error handling, so we can call them directly

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { default: handler } = await import('./api/auth/login.js');
  await handler(req, res);
});

app.post('/api/auth/register', async (req, res) => {
  const { default: handler } = await import('./api/auth/register.js');
  await handler(req, res);
});

app.get('/api/auth/verify', async (req, res) => {
  const { default: handler } = await import('./api/auth/verify.js');
  await handler(req, res);
});

// Character endpoints
app.get('/api/characters/get', async (req, res) => {
  const { default: handler } = await import('./api/characters/get.js');
  await handler(req, res);
});

app.post('/api/characters/create', async (req, res) => {
  const { default: handler } = await import('./api/characters/create.js');
  await handler(req, res);
});

app.put('/api/characters/update', async (req, res) => {
  const { default: handler } = await import('./api/characters/update.js');
  await handler(req, res);
});

app.delete('/api/characters/delete', async (req, res) => {
  const { default: handler } = await import('./api/characters/delete.js');
  await handler(req, res);
});

// Serve index.html for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fantasy3D development server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api/*`);
  
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  WARNING: MONGODB_URI not set. API calls will fail.');
    console.warn('   Create a .env.local file with: MONGODB_URI=your-connection-string');
  }
  
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set. Using default (insecure for production).');
  }
});
