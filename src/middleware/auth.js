import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

// ── Vérifie JWT (header Authorization) OU session cookie ──────────────────
export const authenticate = async (req, res, next) => {
  try {
    let userId = null;

    // 1. Essayer JWT depuis Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    }

    // 2. Fallback sur session
    if (!userId && req.session?.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    // Récupérer l'utilisateur
    const result = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    if (!result.rows[0].is_active) {
      return res.status(403).json({ message: 'Compte non activé. En attente de validation.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
    next(err);
  }
};

// ── Vérifie le rôle ────────────────────────────────────────────────────────
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  next();
};

export const requireAdmin  = requireRole('admin');
export const requireMember = requireRole('member', 'admin');

// ── Optionnel : authentifie si token présent, sinon continue ──────────────
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      if (result.rows[0]?.is_active) req.user = result.rows[0];
    } else if (req.session?.userId) {
      const result = await query(
        'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
        [req.session.userId]
      );
      if (result.rows[0]?.is_active) req.user = result.rows[0];
    }
  } catch { /* ignore */ }
  next();
};
