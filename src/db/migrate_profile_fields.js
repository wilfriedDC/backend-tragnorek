import { pool } from './index.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS hometown VARCHAR(100) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS phone    VARCHAR(30)  DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS facebook VARCHAR(300) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS linkedin VARCHAR(300) DEFAULT NULL;
    `);
    await client.query('COMMIT');
    console.log('✅ Migration profile fields réussie !');
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