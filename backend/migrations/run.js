require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '001_initial_schema.sql'), 'utf8');
  try {
    console.log('Running migrations...');
    await pool.query(sql);
    console.log('Migrations done.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
