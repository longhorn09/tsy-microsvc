'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('./config');

async function migrate() {
  const config = getDbConfig();
  const { database, ...serverConfig } = config;

  const server = await mysql.createConnection({
    ...serverConfig,
    multipleStatements: true,
  });

  try {
    await server.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await server.end();
  }

  const conn = await mysql.createConnection({
    ...config,
    multipleStatements: true,
  });

  try {
    const sqlDir = path.join(__dirname, '../sql');
    const files = fs
      .readdirSync(sqlDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      console.log(`Applying ${file}...`);
      await conn.query(sql);
    }

    console.log('Migrations complete.');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrate };
