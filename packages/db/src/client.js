'use strict';

const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const { getDatabaseUrl } = require('./config');
const schema = require('./schema');

neonConfig.webSocketConstructor = ws;

let pool;
let db;

function initDb() {
  if (db) return db;

  pool = new Pool({ connectionString: getDatabaseUrl() });
  db = drizzle(pool, { schema });
  return db;
}

function getDb() {
  return initDb();
}

async function closeDb() {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
}

module.exports = {
  initDb,
  getDb,
  closeDb,
};
