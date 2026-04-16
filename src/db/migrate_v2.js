// src/db/migrate_v2.js
// Exécuter une seule fois : node src/db/migrate_v2.js

import { pool } from './index.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Users : nouveaux champs profil ────────────────────────────────────
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS hometown VARCHAR(100),
        ADD COLUMN IF NOT EXISTS phone    VARCHAR(50),
        ADD COLUMN IF NOT EXISTS facebook VARCHAR(300),
        ADD COLUMN IF NOT EXISTS linkedin VARCHAR(300);
    `);
    console.log('✅ Users : hometown, phone, facebook, linkedin ajoutés');

    // ── Events : max_participants + category ──────────────────────────────
    await client.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS category         VARCHAR(50) DEFAULT NULL;
    `);
    console.log('✅ Events : max_participants, category ajoutés');

    // ── Gallery : s'assurer que src existe ────────────────────────────────
    // (la table a déjà src depuis migrate.js, mais au cas où)
    await client.query(`
      ALTER TABLE gallery
        ADD COLUMN IF NOT EXISTS src VARCHAR(500);
    `);
    console.log('✅ Gallery : colonne src vérifiée');

    await client.query('COMMIT');
    console.log('🎉 Migration v2 réussie !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration v2 échouée :', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();