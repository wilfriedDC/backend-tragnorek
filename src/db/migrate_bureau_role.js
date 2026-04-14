import { pool } from './index.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bureau_role VARCHAR(100) DEFAULT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration bureau_role réussie !');
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