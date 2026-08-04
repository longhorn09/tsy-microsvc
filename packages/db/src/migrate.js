'use strict';

const fs = require('fs');
const path = require('path');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const { getDatabaseUrl } = require('./config');

neonConfig.webSocketConstructor = ws;

async function migrate() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const sqlDir = path.join(__dirname, '../sql');
  const files = fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      const statement = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      console.log(`Applying ${file}...`);
      await pool.query(statement);
    }
    console.log('Migrations complete.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrate };
