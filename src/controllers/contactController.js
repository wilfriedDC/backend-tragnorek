import { query } from '../db/index.js';

// ── POST /contact ──────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  await query(
    'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)',
    [name.trim(), email.toLowerCase().trim(), message.trim()]
  );

  res.status(201).json({ ok: true, message: 'Message envoyé avec succès.' });
};

// ── GET /admin/contact ─────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  const result = await query(`
    SELECT id, name, email, message, is_read, created_at
    FROM contact_messages
    ORDER BY created_at DESC
  `);
  res.json({ ok: true, data: result.rows });
};

// ── PATCH /admin/contact/:id/read ─────────────────────────────────────────
export const markAsRead = async (req, res) => {
  await query('UPDATE contact_messages SET is_read = true WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
};
