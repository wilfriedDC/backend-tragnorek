import { pool } from './index.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ajouter max_participants et category aux events
    await client.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS category         VARCHAR(50) DEFAULT NULL;
    `);

    // S'assurer que gallery a bien la colonne src (et pas image_url)
    await client.query(`
      ALTER TABLE gallery
        ADD COLUMN IF NOT EXISTS src VARCHAR(500);
    `);

    // Migrer image_url → src si nécessaire
    await client.query(`
      UPDATE gallery SET src = image_url WHERE src IS NULL AND image_url IS NOT NULL;
    `).catch(() => {}); // ignore si image_url n'existe pas

    await client.query('COMMIT');
    console.log('✅ Migration events + gallery réussie !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration échouée :', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();