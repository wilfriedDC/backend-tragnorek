import { query } from '../db/index.js';

// ── GET /members/bureau ────────────────────────────────────────────────────
export const getBureau = async (req, res) => {
  const result = await query(`
    SELECT id, name, email, role, profession, city, bio, avatar_url
    FROM users
    WHERE role IN ('admin', 'bureau') AND is_active = true
    ORDER BY created_at ASC
  `);
  res.json({ ok: true, data: result.rows });
};

// ── GET /members ───────────────────────────────────────────────────────────
export const getCommunity = async (req, res) => {
  const { search } = req.query;
  let text = `
    SELECT id, name, profession, city, bio, avatar_url, created_at
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
};

// ── GET /admin/members/pending ─────────────────────────────────────────────
export const getPending = async (req, res) => {
  const result = await query(`
    SELECT id, name, email, profession, city, plan, created_at
    FROM users
    WHERE role = 'pending' AND is_active = false
    ORDER BY created_at DESC
  `);
  res.json({ ok: true, data: result.rows });
};

// ── PATCH /admin/members/:id/approve ──────────────────────────────────────
export const approveMember = async (req, res) => {
  const { id } = req.params;
  const result = await query(`
    UPDATE users SET role = 'member', is_active = true, updated_at = NOW()
    WHERE id = $1 RETURNING id, name, email, role
  `, [id]);

  if (!result.rows[0]) return res.status(404).json({ message: 'Membre introuvable.' });
  res.json({ ok: true, user: result.rows[0] });
};

// ── DELETE /admin/members/:id/reject ──────────────────────────────────────
export const rejectMember = async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'pending']);
  res.json({ ok: true, message: 'Membre refusé et supprimé.' });
};

// ── GET /members/:id ───────────────────────────────────────────────────────
export const getMemberById = async (req, res) => {
  const { id } = req.params;
  const result = await query(`
    SELECT id, name, profession, city, bio, avatar_url, created_at
    FROM users WHERE id = $1 AND is_active = true
  `, [id]);

  if (!result.rows[0]) return res.status(404).json({ message: 'Membre introuvable.' });
  res.json({ ok: true, data: result.rows[0] });
};

// ── PATCH /members/me ──────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { name, profession, city, bio } = req.body;
  const result = await query(`
    UPDATE users SET name = COALESCE($1, name), profession = COALESCE($2, profession),
      city = COALESCE($3, city), bio = COALESCE($4, bio), updated_at = NOW()
    WHERE id = $5
    RETURNING id, name, email, profession, city, bio, avatar_url
  `, [name, profession, city, bio, req.user.id]);

  res.json({ ok: true, user: result.rows[0] });
};

// ── POST /members/me/avatar ────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });

  const avatarUrl = `/uploads/${req.file.filename}`;
  await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
  res.json({ ok: true, avatarUrl });
};
