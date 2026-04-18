import { query } from '../db/index.js';

// ── GET /gallery ──────────────────────────────────────────────────────────
export const getGallery = async (req, res) => {
  try {
    const isAuth = !!req.user;
    // Les items privés ne sont visibles que pour les membres connectés
    const text = isAuth
      ? `SELECT id, title, src, category, is_private, created_at FROM gallery ORDER BY created_at DESC`
      : `SELECT id, title, src, category, created_at FROM gallery WHERE is_private = false ORDER BY created_at DESC`;

    const result = await query(text);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};
import { uploadToStorage, deleteFromStorage } from '../lib/supabase.js';
import path from 'path';
 
export const addGalleryItem = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Aucune image envoyée.' });
 
    const { title, category, is_private } = req.body;
    const ext = path.extname(req.file.originalname);
    const filename = `gallery-${Date.now()}${ext}`;
 
    // ✅ Upload vers Supabase Storage
    const src = await uploadToStorage(req.file.buffer, filename, req.file.mimetype, 'gallery');
 
    const result = await query(`
      INSERT INTO gallery (title, src, category, is_private, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, src, category, is_private, created_at
    `, [title || null, src, category || null, is_private === 'true', req.user.id]);
 
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur upload galerie.' });
  }
};
 
export const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    // Récupérer l'URL pour supprimer aussi de Supabase Storage
    const existing = await query('SELECT src FROM gallery WHERE id = $1', [id]);
    if (existing.rows[0]?.src) {
      await deleteFromStorage(existing.rows[0].src);
    }
    await query('DELETE FROM gallery WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur suppression.' });
  }
};
 
 