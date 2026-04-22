const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'campuscart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

pool.on('connect', () => console.log('Connected to PostgreSQL'));
pool.on('error', (err) => {
  console.error('PostgreSQL error:', err.message);
  process.exit(1);
});

module.exports = pool;
