import { query } from '../db/index.js';

// ── GET /events?status=upcoming|past ──────────────────────────────────────
export const getEvents = async (req, res) => {
  const { status } = req.query;
  const isPast = status === 'past';

  const result = await query(`
    SELECT id, title, description, date, location, type, price, image_url, is_past
    FROM events
    WHERE is_past = $1
    ORDER BY date ${isPast ? 'DESC' : 'ASC'}
  `, [isPast]);

  res.json({ ok: true, data: result.rows });
};

// ── GET /events/:id ────────────────────────────────────────────────────────
export const getEventById = async (req, res) => {
  const result = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
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
      INSERT INTO event_registrations (event_id, user_id, first_name, last_name, email, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [eventId, userId, firstName, lastName, email || req.user?.email, paymentMethod || 'mobile']);

    res.status(201).json({ ok: true, registrationId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Vous êtes déjà inscrit à cet événement.' });
    }
    throw err;
  }
};

// ── GET /admin/events/registrations ───────────────────────────────────────
export const getRegistrations = async (req, res) => {
  const result = await query(`
    SELECT er.id, e.title AS event, er.first_name || ' ' || er.last_name AS name,
           er.email, er.registered_at AS date, er.paid
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    ORDER BY er.registered_at DESC
  `);
  res.json({ ok: true, data: result.rows });
};

// ── POST /admin/events ─────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
  const { title, description, date, location, type, price, imageUrl } = req.body;

  const result = await query(`
    INSERT INTO events (title, description, date, location, type, price, image_url, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [title, description, date, location, type, price || 0, imageUrl || null, req.user.id]);

  res.status(201).json({ ok: true, data: result.rows[0] });
};

// ── DELETE /admin/events/:id ───────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  await query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ ok: true, message: 'Événement supprimé.' });
};
