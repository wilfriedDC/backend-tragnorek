import bcrypt from 'bcryptjs';
import { pool } from './index.js';

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Admin ──────────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, profession, city, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin Tragnorek', 'admin@asso.mg', adminHash, 'admin', 'Administrateur', 'Vatomandry', true]);

    // ── Membre test ────────────────────────────────────────────────────────
    const memberHash = await bcrypt.hash('membre123', 12);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, profession, city, bio, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
    `, ['Wilfried DC', 'wilfried@mail.mg', memberHash, 'member', 'Designer', 'Vatomandry', 'Membre actif de l\'association depuis 2023.', true]);

    // ── Events ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO events (title, description, date, location, type, price, image_url)
      VALUES
        ('Célébration du Nouvel An 2026', 'Notre plus grand rassemblement annuel.', '2026-04-18 20:00:00+01', 'villa Kalotody', 'Gala', 12.000, 'https://images.unsplash.com/photo-1516997121675-4c2d04fe11d7?w=800'),
        ('Atelier Pro : La Tech en 2026', 'Une plongée dans les tendances de l''industrie.', '2026-02-15 14:00:00+01', 'Hometown Hub', 'Formation', 0.00, 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800')
      ON CONFLICT DO NOTHING
    `);

    // ── Gallery ────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO gallery (title, src, category, is_private)
      VALUES
        ('New Year Dinner',      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', 'Social',     false),
        ('Leadership Training',  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800', 'Workshops',  true),
        ('Annual Conference',    'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800', 'Events',     false),
        ('Summer Gathering',     'https://images.unsplash.com/photo-1528605248644-14dd04322a11?w=800', 'Social',     false),
        ('Art Atelier',          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', 'Workshops',  true),
        ('Community Awards',     'https://images.unsplash.com/photo-1475721027785-f74dea327912?w=800', 'Events',     false)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Seed réussi !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed échoué :', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
