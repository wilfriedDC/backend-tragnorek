import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

// ── Générer les tokens ─────────────────────────────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

// ── POST /auth/login ───────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const result = await query(
      'SELECT id, name, email, password_hash, role, is_active, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Compte en attente de validation par un administrateur.' });
    }

    // Générer JWT
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Sauvegarder refresh token en DB
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Sauvegarder en session aussi
    req.session.userId = user.id;
    req.session.role   = user.role;

    // Cookie refresh token httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    });

    const { password_hash, ...safeUser } = user;

    res.json({
      ok: true,
      token: accessToken,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /auth/register ────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, profession, city, bio, plan } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe requis.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    // Vérifier si email déjà utilisé
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows[0]) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Créer le compte (rôle pending, is_active false — attente validation admin)
    const result = await query(`
      INSERT INTO users (name, email, password_hash, role, profession, city, bio, plan, is_active)
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, false)
      RETURNING id, name, email, role
    `, [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      profession || null,
      city       || null,
      bio        || null,
      plan       || 'annual',
    ]);

    res.status(201).json({
      ok: true,
      message: 'Inscription réussie. En attente de validation par un administrateur.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /auth/logout ──────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    // Supprimer refresh token DB
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    // Détruire session
    req.session.destroy();

    // Effacer cookie
    res.clearCookie('refreshToken');
    res.clearCookie('connect.sid');

    res.json({ ok: true, message: 'Déconnecté.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /auth/refresh ─────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Refresh token manquant.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ message: 'Token invalide.' });

    // Vérifier en DB
    const stored = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (!stored.rows[0]) return res.status(401).json({ message: 'Token expiré ou révoqué.' });

    // Récupérer user
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );
    if (!userResult.rows[0]) return res.status(401).json({ message: 'Utilisateur introuvable.' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId, userResult.rows[0].role);

    // Rotation du refresh token
    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [decoded.userId, newRefresh, expiresAt]
    );

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true, token: accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

// ── GET /auth/me ───────────────────────────────────────────────────────────
export const me = async (req, res) => {
  const result = await query(
    'SELECT id, name, email, role, profession, city, bio, avatar_url, plan, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ ok: true, user: result.rows[0] });
};
