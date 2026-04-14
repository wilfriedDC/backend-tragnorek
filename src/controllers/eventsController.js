import { query } from '../db/index.js';
import path from 'path';
import fs from 'fs';

// ── GET /events?status=upcoming|past ──────────────────────────────────────
export const getEvents = async (req, res) => {
  const { status } = req.query;
  const isPast = status === 'past';
  const result = await query(`
    SELECT id, title, description, date as datetime, location,
           type as category, price, image_url, is_past, max_participants
    FROM events WHERE is_past = $1
    ORDER BY date ${isPast ? 'DESC' : 'ASC'}
  `, [isPast]);
  res.json({ ok: true, data: result.rows });
};

// ── GET /events/:id ────────────────────────────────────────────────────────
export const getEventById = async (req, res) => {
  const result = await query(
    'SELECT *, date as datetime, type as category FROM events WHERE id = $1',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'Événement introuvable.' });
  res.json({ ok: true, data: result.rows[0] });
};

// ── POST /events/:id/register ──────────────────────────────────────────────
export const registerForEvent = async (req, res) => {
  const { id: eventId } = req.params;
  const { firstName, lastName, email, paymentMethod } = req.body;
  const userId = req.user?.id || null;
  try {
    const result = await query(`
      INSERT INTO event_registrations
        (event_id, user_id, first_name, last_name, email, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [eventId, userId, firstName, lastName, email || req.user?.email, paymentMethod || 'mobile']);
    res.status(201).json({ ok: true, registrationId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Vous êtes déjà inscrit.' });
    throw err;
  }
};

// ── GET /admin/events/registrations ───────────────────────────────────────
export const getRegistrations = async (req, res) => {
  const result = await query(`
    SELECT er.id, e.title AS event,
           er.first_name || ' ' || er.last_name AS name,
           er.email, er.registered_at, er.paid
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    ORDER BY er.registered_at DESC
  `);
  res.json({ ok: true, data: result.rows });
};

// ── POST /admin/events — avec upload image optionnel ──────────────────────
export const createEvent = async (req, res) => {
  const {
    title, description, datetime, location,
    category, price, is_free, max_participants
  } = req.body;

  if (!title || !datetime) {
    return res.status(400).json({ message: 'Titre et date sont requis.' });
  }

  const finalPrice = (is_free === 'true' || is_free === true) ? 0 : (parseFloat(price) || 0);
  const imageUrl   = req.file ? `/uploads/${req.file.filename}` : null;

  const result = await query(`
    INSERT INTO events
      (title, description, date, location, type, price, image_url, max_participants, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, title, description, date as datetime, location,
              type as category, price, image_url, max_participants, is_past
  `, [
    title,
    description    || null,
    datetime,
    location       || null,
    category       || null,
    finalPrice,
    imageUrl,
    max_participants ? parseInt(max_participants) : null,
    req.user.id,
  ]);

  res.status(201).json({ ok: true, data: result.rows[0] });
};

// ── DELETE /admin/events/:id ───────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  // Supprimer l'image si uploadée localement
  const existing = await query('SELECT image_url FROM events WHERE id = $1', [req.params.id]);
  if (existing.rows[0]?.image_url?.startsWith('/uploads/')) {
    try { fs.unlinkSync(path.join(process.cwd(), existing.rows[0].image_url)); } catch {}
  }
  await query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
};