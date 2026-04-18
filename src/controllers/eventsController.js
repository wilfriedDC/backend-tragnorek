import { query } from '../db/index.js';

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
      // upcoming par défaut
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
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
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

    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'Événement introuvable.' });
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};

// ── POST /admin/events  (multipart/form-data) ─────────────────────────────

export const createEvent = async (req, res) => {
  try {
    const { title, description, datetime, date, location, type, category, price, max_participants, is_free } = req.body;
 
    if (!title) return res.status(400).json({ ok: false, message: 'Le titre est requis.' });
    const eventDate = datetime || date;
    if (!eventDate) return res.status(400).json({ ok: false, message: 'La date est requise.' });
 
    const finalPrice = is_free === 'true' || is_free === true ? 0 : parseFloat(price) || 0;
 
    // ✅ Upload image vers Supabase Storage si présente
    let imageUrl = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filename = `event-${Date.now()}${ext}`;
      imageUrl = await uploadToStorage(req.file.buffer, filename, req.file.mimetype, 'events');
    }
 
    const result = await query(`
      INSERT INTO events (title, description, date, location, type, category, price, image_url, max_participants, is_past, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10)
      RETURNING id, title, description, date, location, type, category, price, image_url, max_participants, is_past, created_at
    `, [
      title, description || null, new Date(eventDate), location || null,
      type || category || null, category || null, finalPrice, imageUrl,
      max_participants ? parseInt(max_participants) : null, req.user.id,
    ]);
 
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur création événement.' });
  }
};

// ── DELETE /admin/events/:id ──────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Erreur suppression.' });
  }
};

// ── POST /events/:id/register ─────────────────────────────────────────────
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, payment_method } = req.body;
    const userId = req.user.id;

    // Vérifier que l'événement existe
    const evRes = await query('SELECT id, max_participants FROM events WHERE id = $1', [id]);
    if (!evRes.rows[0]) return res.status(404).json({ ok: false, message: 'Événement introuvable.' });

    // Vérifier si déjà inscrit
    const existing = await query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows[0]) return res.status(409).json({ ok: false, message: 'Déjà inscrit à cet événement.' });

    // Vérifier max participants
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
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, event_id, first_name, last_name, email, registered_at
    `, [
      id, userId,
      first_name || req.user.name?.split(' ')[0] || null,
      last_name  || req.user.name?.split(' ').slice(1).join(' ') || null,
      email      || req.user.email,
      payment_method || null,
      payment_method ? false : true, // gratuit = paid true
    ]);

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur inscription.' });
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
    res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
};