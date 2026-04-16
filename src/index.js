import 'dotenv/config';

import pg from "pg";


import express      from 'express';
import cors         from 'cors';
import cookieParser from 'cookie-parser';
import session      from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path         from 'path';
import { fileURLToPath } from 'url';

import routes       from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3000;

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Sessions (stockées en PostgreSQL) ─────────────────────────────────────
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret:            process.env.SESSION_SECRET || 'change-me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   parseInt(process.env.SESSION_MAX_AGE || '604800000'),
  },
  name: 'hometown.sid',
}));

// ── Fichiers statiques (avatars uploadés) ─────────────────────────────────
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Routes API ─────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📦 ENV: ${process.env.NODE_ENV || 'development'}`);
});

console.log("CLIENT_URL =", process.env.CLIENT_URL);