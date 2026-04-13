import { query } from '../db/index.js';

// ── GET /gallery ───────────────────────────────────────────────────────────
export const getGallery = async (req, res) => {
  const isAuth = !!req.user;

  // Les non-membres voient les photos publiques seulement
  const result = await query(`
    SELECT id, title, src, category, is_private
    FROM gallery
    ${!isAuth ? 'WHERE is_private = false' : ''}
    ORDER BY created_at DESC
  `);

  res.json({ ok: true, data: result.rows });
};

// ── POST /admin/gallery ────────────────────────────────────────────────────
export const addGalleryItem = async (req, res) => {
  const { title, src, category, isPrivate } = req.body;

  const result = await query(`
    INSERT INTO gallery (title, src, category, is_private, uploaded_by)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `, [title, src, category, isPrivate || false, req.user.id]);

  res.status(201).json({ ok: true, data: result.rows[0] });
};

// ── DELETE /admin/gallery/:id ──────────────────────────────────────────────
export const deleteGalleryItem = async (req, res) => {
  await query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
};
