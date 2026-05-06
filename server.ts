import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Panchayat } from './server/models';
import apiRoutes from './server/api';

// In-memory fallback for Demo Mode
const mockDB = {
  users: [
    { 
      id: 'admin_demo', 
      name: 'Digital Panchayat Admin', 
      email: 'admin@panchayat.gov.in', 
      password: '', // Will be hashed below
      role: 'dm', 
      panchayat: null 
    }
  ] as any[],
  complaints: [] as any[],
  panchayats: [
    { _id: 'm1', name: 'Gopalganj', district: 'Gopalganj', state: 'Bihar' },
    { _id: 'm2', name: 'Supaul', district: 'Supaul', state: 'Bihar' },
    { _id: 'm3', name: 'Madhubani', district: 'Madhubani', state: 'Bihar' },
    { _id: 'm4', name: 'Larahi', district: 'Hazaribagh', state: 'Jharkhand' },
    { _id: 'm5', name: 'Purnia', district: 'Purnia', state: 'Bihar' }
  ]
};

// Hash the default admin password
bcrypt.hash('admin123', 10).then(hash => {
  mockDB.users[0].password = hash;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seed Data
const seedPanchayats = [
  { name: 'Bawania', district: 'Mahendragarh', state: 'Haryana', boundary: { type: 'Polygon', coordinates: [[[76.1, 28.2], [76.2, 28.2], [76.2, 28.3], [76.1, 28.3], [76.1, 28.2]]] } },
  { name: 'Kothal Kalan', district: 'Mahendragarh', state: 'Haryana', boundary: { type: 'Polygon', coordinates: [[[76.1, 28.1], [76.2, 28.1], [76.2, 28.2], [76.1, 28.2], [76.1, 28.1]]] } },
  { name: 'Larahi', district: 'Hazaribagh', state: 'Jharkhand', boundary: { type: 'Polygon', coordinates: [[[85.3, 23.9], [85.4, 23.9], [85.4, 24.0], [85.3, 24.0], [85.3, 23.9]]] } },
  { name: 'Dhango', district: 'Sitamarhi', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[85.4, 26.5], [85.5, 26.5], [85.5, 26.6], [85.4, 26.6], [85.4, 26.5]]] } },
  { name: 'Rampur', district: 'Shimla', state: 'Himachal Pradesh', boundary: { type: 'Polygon', coordinates: [[[77.6, 31.4], [77.7, 31.4], [77.7, 31.5], [77.6, 31.5], [77.6, 31.4]]] } },
  { name: 'Chak Ganjaria', district: 'Lucknow', state: 'Uttar Pradesh', boundary: { type: 'Polygon', coordinates: [[[81.0, 26.7], [81.1, 26.7], [81.1, 26.8], [81.0, 26.8], [81.0, 26.7]]] } },
  { name: 'Rohtas', district: 'Rohtas', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[84.0, 24.6], [84.1, 24.6], [84.1, 24.7], [84.0, 24.7], [84.0, 24.6]]] } },
  { name: 'Sikandarpur', district: 'Ballia', state: 'Uttar Pradesh', boundary: { type: 'Polygon', coordinates: [[[84.0, 25.9], [84.1, 25.9], [84.1, 26.0], [84.0, 26.0], [84.0, 25.9]]] } },
  { name: 'Barhampur', district: 'Buxar', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[84.2, 25.6], [84.3, 25.6], [84.3, 25.7], [84.2, 25.7], [84.2, 25.6]]] } },
  { name: 'Maner', district: 'Patna', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[84.8, 25.6], [84.9, 25.6], [84.9, 25.7], [84.8, 25.7], [84.8, 25.6]]] } },
  { name: 'Hazaribagh', district: 'Hazaribagh', state: 'Jharkhand', boundary: { type: 'Polygon', coordinates: [[[85.3, 23.9], [85.4, 23.9], [85.4, 24.0], [85.3, 24.0], [85.3, 23.9]]] } },
  { name: 'Gopalganj', district: 'Gopalganj', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[84.3, 26.4], [84.4, 26.4], [84.4, 26.5], [84.3, 26.5], [84.3, 26.4]]] } },
  { name: 'Supaul', district: 'Supaul', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[86.5, 26.1], [86.6, 26.1], [86.6, 26.2], [86.5, 26.2], [86.5, 26.1]]] } },
  { name: 'Madhubani', district: 'Madhubani', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[86.0, 26.3], [86.1, 26.3], [86.1, 26.4], [86.0, 26.4], [86.0, 26.3]]] } },
  { name: 'Purnia', district: 'Purnia', state: 'Bihar', boundary: { type: 'Polygon', coordinates: [[[87.4, 25.7], [87.5, 25.7], [87.5, 25.8], [87.4, 25.8], [87.4, 25.7]]] } }
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const MONGODB_URI = process.env.MONGODB_URI;

  app.use(cors());
  app.use(express.json());

  // Inject mockDB into request for API routes fallback
  app.use((req: any, res, next) => {
    req.mockDB = mockDB;
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.use('/api', apiRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      dbConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString() 
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('SERVER ERROR:', err.stack || err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log(`>>> SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`>>> ENVIRONMENT: ${process.env.NODE_ENV || 'development'}`);
    console.log(`>>> MONGODB CONFIGURED: ${process.env.MONGODB_URI ? 'YES' : 'NO'}`);
    if (!process.env.MONGODB_URI) {
      console.log('>>> IMPORTANT: Please check if your .env file is named ".env" (with a dot at the start)');
    }
    console.log('-------------------------------------------');
    
    // Connect to DB and Seed in background
    if (MONGODB_URI && !MONGODB_URI.includes('PASSWORD')) {
      mongoose.connect(MONGODB_URI)
        .then(async () => {
          console.log('>>> SUCCESS: Connected to MongoDB');
          
          // Seed Initial Panchayats
          try {
            for (const p of seedPanchayats) {
              const exists = await Panchayat.findOne({ name: p.name });
              if (!exists) {
                await Panchayat.create(p as any);
                console.log(`[SEED] Added Panchayat: ${p.name}`);
              }
            }

            // Seed Admin (DM)
            const adminEmail = 'piyush@demo.com';
            const adminExists = await User.findOne({ email: adminEmail });
            if (!adminExists) {
              const hashedPassword = await bcrypt.hash('demo123', 10);
              await User.create({
                name: 'Pivush (District Magistrate)',
                email: adminEmail,
                password: hashedPassword,
                role: 'dm'
              });
              console.log(`[SEED] DM Account Created: ${adminEmail} / demo123`);
            }
          } catch (seedErr) {
            console.error('[SEED ERROR]:', seedErr);
          }
        })
        .catch((err) => {
          console.error('>>> CRITICAL DATABASE ERROR:', err.message);
          console.log('Make sure your MONGODB_URI in .env is correct and your IP is whitelisted in MongoDB Atlas.');
        });
    } else {
      console.warn('>>> WARNING: MONGODB_URI IS MISSING! <<<');
      console.log('1. Create a file named .env in your project folder.');
      console.log('2. Add MONGODB_URI=your_mongodb_connection_string');
      console.log('3. Restart the server.');
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
