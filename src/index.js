import 'dotenv/config';
import '../seed.js';
import express         from 'express';
import cors            from 'cors';
import cookieParser    from 'cookie-parser';
import session         from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path            from 'path';
import { fileURLToPath } from 'url';
import { pool }        from './db/index.js';
import routes          from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app        = express();
const PORT       = process.env.PORT || 3000;
const isProd     = process.env.NODE_ENV === 'production';

// ── CORS ───────────────────────────────────────────────────────────────────
// Accepte plusieurs origines séparées par virgule, nettoie les slashes finaux
const RAW_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

console.log('✅ Origines CORS autorisées :', RAW_ORIGINS);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    if (RAW_ORIGINS.includes(clean)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS bloqué : "${origin}"`);
      console.warn('   Origines acceptées :', RAW_ORIGINS);
      callback(new Error(`CORS policy: origin "${origin}" not allowed`));
    }
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Sessions ───────────────────────────────────────────────────────────────
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    tableName:            'session',
    createTableIfMissing: false,
  }),
  secret:            process.env.SESSION_SECRET || 'change-me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   parseInt(process.env.SESSION_MAX_AGE || '604800000'),
  },
  name: 'hometown.sid',
}));

// ── Fichiers statiques ────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, origins: RAW_ORIGINS });
});

// ── Routes API ─────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur.',
    ...(!isProd && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📦 ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 CLIENT_URL: ${process.env.CLIENT_URL}`);
});