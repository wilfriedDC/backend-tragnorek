import { pool } from './index.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Users ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'pending',
        profession    VARCHAR(100),
        city          VARCHAR(100),
        bio           TEXT,
        avatar_url    VARCHAR(500),
        plan          VARCHAR(20)  DEFAULT 'annual',
        is_active     BOOLEAN      DEFAULT false,
        created_at    TIMESTAMPTZ  DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ── Refresh tokens ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token      VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Events ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        date        TIMESTAMPTZ  NOT NULL,
        location    VARCHAR(200),
        type        VARCHAR(50),
        price       DECIMAL(10,2) DEFAULT 0,
        image_url   VARCHAR(500),
        is_past     BOOLEAN      DEFAULT false,
        created_by  INTEGER REFERENCES users(id),
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ── Event registrations ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id           SERIAL PRIMARY KEY,
        event_id     INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id      INTEGER REFERENCES users(id)  ON DELETE CASCADE,
        first_name   VARCHAR(100),
        last_name    VARCHAR(100),
        email        VARCHAR(150),
        payment_method VARCHAR(50),
        paid         BOOLEAN     DEFAULT false,
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      );
    `);

    // ── Gallery ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id         SERIAL PRIMARY KEY,
        title      VARCHAR(200),
        src        VARCHAR(500) NOT NULL,
        category   VARCHAR(50),
        is_private BOOLEAN      DEFAULT false,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // ── Contact messages ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100),
        email      VARCHAR(150),
        message    TEXT NOT NULL,
        is_read    BOOLEAN     DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Sessions (connect-pg-simple) ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid"    VARCHAR      NOT NULL COLLATE "default",
        "sess"   JSON         NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    // ── Updated_at trigger ─────────────────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_updated_at ON users;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await client.query('COMMIT');
    console.log('✅ Migration réussie !');
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
