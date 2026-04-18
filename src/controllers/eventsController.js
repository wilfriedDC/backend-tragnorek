import { query } from '../db/index.js';
import * as path from 'path';
import { uploadToStorage } from '../lib/supabase.js';

// ── GET /events?status=upcoming|past ──────────────────────────────────────
export const getEvents = async (req, res) => {
  try {
    const { status } = req.query;
    let text;

    if (status === 'past') {
      text = `
        SELECT id, title, description, date, location, type, category,
               price, image_url, is_past, max_participants, created_at
        FROM events
        WHERE is_past = true OR date < NOW()
        ORDER BY date DESC
      `;
    } else {
      text = `
        SELECT id, title, description, date, location, type, category,
               price, image_url, is_past, max_participants, created_at
        FROM events
        WHERE is_past = false AND date >= NOW()
        ORDER BY date ASC
      `;
    }

    const result = await query(text);
    res.json({ ok: true, data: result.rows });

  } catch (err) {
    console.error('❌ GET EVENTS ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── GET /events/:id ───────────────────────────────────────────────────────
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, title, description, date, location, type, category,
             price, image_url, is_past, max_participants, created_at
      FROM events WHERE id = $1
    `, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({ ok: false, message: 'Événement introuvable.' });
    }

    res.json({ ok: true, data: result.rows[0] });

  } catch (err) {
    console.error('❌ GET EVENT ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── POST /admin/events ────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      datetime,
      date,
      location,
      type,
      category,
      price,
      max_participants,
      is_free
    } = req.body;

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Le titre est requis.' });
    }

    const eventDate = datetime || date;
    if (!eventDate) {
      return res.status(400).json({ ok: false, message: 'La date est requise.' });
    }

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ ok: false, message: 'Date invalide.' });
    }

    const finalPrice =
      is_free === 'true' || is_free === true
        ? 0
        : parseFloat(price) || 0;

    let imageUrl = null;

    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filename = `event-${Date.now()}${ext}`;

      imageUrl = await uploadToStorage(
        req.file.buffer,
        filename,
        req.file.mimetype,
        'events'
      );
    }

    const result = await query(`
      INSERT INTO events
      (title, description, date, location, type, category, price, image_url, max_participants, is_past, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10)
      RETURNING id, title, description, date, location, type, category, price, image_url, max_participants, is_past, created_at
    `, [
      title,
      description || null,
      parsedDate,
      location || null,
      type || category || null,
      category || null,
      finalPrice,
      imageUrl,
      max_participants ? parseInt(max_participants) : null,
      req.user.id
    ]);

    res.status(201).json({ ok: true, data: result.rows[0] });

  } catch (err) {
    console.error('❌ CREATE EVENT ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── DELETE /admin/events/:id ──────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ ok: true });

  } catch (err) {
    console.error('❌ DELETE EVENT ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── POST /events/:id/register ─────────────────────────────────────────────
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, payment_method } = req.body;
    const userId = req.user.id;

    const evRes = await query(
      'SELECT id, max_participants FROM events WHERE id = $1',
      [id]
    );

    if (!evRes.rows[0]) {
      return res.status(404).json({ ok: false, message: 'Événement introuvable.' });
    }

    const existing = await query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows[0]) {
      return res.status(409).json({ ok: false, message: 'Déjà inscrit.' });
    }

    const { max_participants } = evRes.rows[0];

    if (max_participants) {
      const countRes = await query(
        'SELECT COUNT(*) FROM event_registrations WHERE event_id = $1',
        [id]
      );

      if (parseInt(countRes.rows[0].count) >= max_participants) {
        return res.status(400).json({ ok: false, message: 'Événement complet.' });
      }
    }

    const result = await query(`
      INSERT INTO event_registrations
      (event_id, user_id, first_name, last_name, email, payment_method, paid)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, event_id, first_name, last_name, email, registered_at
    `, [
      id,
      userId,
      first_name || null,
      last_name || null,
      email || req.user.email,
      payment_method || null,
      payment_method ? false : true
    ]);

    res.status(201).json({ ok: true, data: result.rows[0] });

  } catch (err) {
    console.error('❌ REGISTER EVENT ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── GET /admin/events/registrations ──────────────────────────────────────
export const getRegistrations = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        er.id,
        er.first_name,
        er.last_name,
        COALESCE(er.first_name || ' ' || er.last_name, u.name) AS name,
        er.email,
        er.payment_method,
        er.paid,
        er.registered_at,
        e.title AS event,
        e.date  AS event_date
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users  u ON er.user_id  = u.id
      ORDER BY er.registered_at DESC
    `);

    res.json({ ok: true, data: result.rows });

  } catch (err) {
    console.error('❌ GET REGISTRATIONS ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};