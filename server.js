import "dotenv/config";
import pool from "./db.js";

async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connected:", res.rows);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testDB();