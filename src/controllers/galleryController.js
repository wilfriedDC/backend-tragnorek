import { query } from '../db/index.js';
import path from 'path';
import fs from 'fs';

// ── GET /gallery ───────────────────────────────────────────────────────────
export const getGallery = async (req, res) => {
  const isAuth = !!req.user;
  const result = await query(`
    SELECT id, title, src, category, is_private, created_at
    FROM gallery
    ${!isAuth ? 'WHERE is_private = false' : ''}
    ORDER BY created_at DESC
  `);
  res.json({ ok: true, data: result.rows });
};

// ── POST /gallery — upload fichier ─────────────────────────────────────────
export const addGalleryItem = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });

  const { title, category, isPrivate } = req.body;
  const src = `/uploads/${req.file.filename}`;

  // Nom propre : enlever l'extension et les tirets
  const cleanTitle = title ||
    req.file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

  const result = await query(`
    INSERT INTO gallery (title, src, category, is_private, uploaded_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, src, category, is_private, created_at
  `, [
    cleanTitle,
    src,
    category || null,
    isPrivate === 'true' || false,
    req.user.id,
  ]);

  res.status(201).json({ ok: true, data: result.rows[0] });
};

// ── DELETE /gallery/:id ────────────────────────────────────────────────────
export const deleteGalleryItem = async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT src FROM gallery WHERE id = $1', [id]);
  if (existing.rows[0]?.src?.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), existing.rows[0].src);
    try { fs.unlinkSync(filePath); } catch {}
  }
  await query('DELETE FROM gallery WHERE id = $1', [id]);
  res.json({ ok: true });
};