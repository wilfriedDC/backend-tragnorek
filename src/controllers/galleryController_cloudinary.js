// src/controllers/galleryController.js
import { query } from '../db/index.js';
import cloudinary from '../config/cloudinary.js';

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

// ✅ Cloudinary : req.file.path = URL HTTPS directe
export const addGalleryItem = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });

  const { title, category, isPrivate } = req.body;
  const src = req.file.path; // URL Cloudinary

  const cleanTitle = title ||
    req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  const result = await query(`
    INSERT INTO gallery (title, src, category, is_private, uploaded_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, src, category, is_private, created_at
  `, [cleanTitle, src, category || null, isPrivate === 'true' || false, req.user.id]);

  res.status(201).json({ ok: true, data: result.rows[0] });
};

export const deleteGalleryItem = async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT src FROM gallery WHERE id=$1', [id]);

  // Supprimer sur Cloudinary si c'est une URL Cloudinary
  if (existing.rows[0]?.src?.includes('cloudinary.com')) {
    try {
      // Extraire le public_id depuis l'URL Cloudinary
      const url   = existing.rows[0].src;
      const parts = url.split('/');
      const file  = parts[parts.length - 1].split('.')[0];
      const folder = parts.slice(parts.indexOf('upload') + 2, -1).join('/');
      const publicId = folder ? `${folder}/${file}` : file;
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.warn('Impossible de supprimer sur Cloudinary:', e.message);
    }
  }

  await query('DELETE FROM gallery WHERE id=$1', [id]);
  res.json({ ok: true });
};