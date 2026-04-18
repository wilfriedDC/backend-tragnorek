import { query } from '../db/index.js';
import { uploadToStorage } from '../lib/supabase.js';
import path from 'path';
 

export const BUREAU_ROLES = [
  'Président', 'Vice-Président', 'Secrétaire Général', 'Trésorier',
  'Responsable Événements', 'Responsable Communication',
  'Chargé de Formation', 'Membre du Bureau',
];

// ── GET /members/bureau ───────────────────────────────────────────────────
export const getBureau = async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, email, role, bureau_role, profession, city, hometown,
             bio, avatar_url, phone, facebook, linkedin
      FROM users
      WHERE role IN ('admin', 'bureau') AND is_active = true
      ORDER BY created_at ASC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── GET /members ──────────────────────────────────────────────────────────
export const getCommunity = async (req, res) => {
  try {
    const { search } = req.query;
    let text = `
      SELECT id, name, profession, city, hometown, bio, avatar_url,
             phone, facebook, linkedin, created_at
      FROM users
      WHERE role = 'member' AND is_active = true
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      text += ` AND (name ILIKE $1 OR profession ILIKE $1)`;
    }
    text += ' ORDER BY created_at DESC';
    const result = await query(text, params);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── GET /admin/members/pending ────────────────────────────────────────────
export const getPending = async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, email, profession, city, plan, created_at
      FROM users WHERE role = 'pending' AND is_active = false
      ORDER BY created_at DESC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── PATCH /admin/members/:id/approve ─────────────────────────────────────
export const approveMember = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      UPDATE users SET role = 'member', is_active = true, updated_at = NOW()
      WHERE id = $1 RETURNING id, name, email, role
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Membre introuvable.' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── DELETE /admin/members/:id/reject ─────────────────────────────────────
export const rejectMember = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'pending']);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── GET /members/:id ──────────────────────────────────────────────────────
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT id, name, profession, city, hometown, bio, avatar_url,
             bureau_role, phone, facebook, linkedin, created_at
      FROM users WHERE id = $1 AND is_active = true
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Membre introuvable.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── PATCH /members/me ─────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, profession, city, hometown, bio, phone, facebook, linkedin } = req.body;
    const result = await query(`
      UPDATE users SET
        name       = COALESCE($1, name),
        profession = COALESCE($2, profession),
        city       = COALESCE($3, city),
        hometown   = COALESCE($4, hometown),
        bio        = COALESCE($5, bio),
        phone      = COALESCE($6, phone),
        facebook   = COALESCE($7, facebook),
        linkedin   = COALESCE($8, linkedin),
        updated_at = NOW()
      WHERE id = $9
      RETURNING id, name, email, profession, city, hometown, bio,
                avatar_url, phone, facebook, linkedin
    `, [name, profession, city, hometown, bio, phone, facebook, linkedin, req.user.id]);
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur mise à jour.' });
  }
};
// Dans membersController.js — remplace uniquement uploadAvatar
 

// ── POST /members/me/avatar ───────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });
 
    const ext = path.extname(req.file.originalname);
    const filename = `avatar-${req.user.id}-${Date.now()}${ext}`;
    // ✅ Upload vers Supabase Storage (pas sur le disque local)
    const avatarUrl = await uploadToStorage(
      req.file.buffer,      // buffer mémoire
      filename,
      req.file.mimetype,
      'avatars'             // dossier dans le bucket
    );
 
    await query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, req.user.id]);
 
    res.json({ ok: true, avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur upload avatar.' });
  }
};
// ── PATCH /admin/members/:id/promote ─────────────────────────────────────
export const promoteToBureau = async (req, res) => {
  try {
    const { id } = req.params;
    const { bureauRole } = req.body;
    if (!bureauRole || !BUREAU_ROLES.includes(bureauRole)) {
      return res.status(400).json({ message: 'Rôle bureau invalide.', validRoles: BUREAU_ROLES });
    }
    const result = await query(`
      UPDATE users SET role = 'bureau', bureau_role = $1, updated_at = NOW()
      WHERE id = $2 AND role = 'member' AND is_active = true
      RETURNING id, name, email, role, bureau_role, profession, city, bio, avatar_url
    `, [bureauRole, id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Membre introuvable ou déjà dans le bureau.' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── PATCH /admin/members/:id/demote ──────────────────────────────────────
export const demoteFromBureau = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      UPDATE users SET role = 'member', bureau_role = NULL, updated_at = NOW()
      WHERE id = $1 AND role = 'bureau'
      RETURNING id, name, email, role
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Membre bureau introuvable.' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── PATCH /admin/members/:id/bureau-role ─────────────────────────────────
export const updateBureauRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { bureauRole } = req.body;
    if (!bureauRole || !BUREAU_ROLES.includes(bureauRole)) {
      return res.status(400).json({ message: 'Rôle invalide.', validRoles: BUREAU_ROLES });
    }
    const result = await query(`
      UPDATE users SET bureau_role = $1, updated_at = NOW()
      WHERE id = $2 AND role = 'bureau'
      RETURNING id, name, bureau_role
    `, [bureauRole, id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Membre bureau introuvable.' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};