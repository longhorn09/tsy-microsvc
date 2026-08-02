'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const {
  Connector,
  IpAddressTypes,
  AuthTypes,
} = require('@google-cloud/cloud-sql-connector');
const {
  getDbConfig,
  getDbCredentials,
  useCloudSqlConnector,
  getInstanceConnectionName,
  getDbIpType,
} = require('./config');

async function withAdminConnection(fn) {
  if (!useCloudSqlConnector()) {
    const config = getDbConfig();
    const { database, ...serverConfig } = config;
    const conn = await mysql.createConnection({
      ...serverConfig,
      multipleStatements: true,
    });
    try {
      return await fn(conn, database);
    } finally {
      await conn.end();
    }
  }

  const credentials = getDbCredentials();
  const localConnector = new Connector();
  try {
    const clientOpts = await localConnector.getOptions({
      instanceConnectionName: getInstanceConnectionName(),
      ipType: IpAddressTypes[getDbIpType()],
      authType: AuthTypes.PASSWORD,
    });
    // Connect to the mysql system schema to create the app database if needed.
    const conn = await mysql.createConnection({
      ...clientOpts,
      user: credentials.user,
      password: credentials.password,
      database: 'mysql',
      multipleStatements: true,
    });
    try {
      return await fn(conn, credentials.database);
    } finally {
      await conn.end();
    }
  } finally {
    localConnector.close();
  }
}

async function withAppConnection(fn) {
  if (!useCloudSqlConnector()) {
    const conn = await mysql.createConnection({
      ...getDbConfig(),
      multipleStatements: true,
    });
    try {
      return await fn(conn);
    } finally {
      await conn.end();
    }
  }

  const credentials = getDbCredentials();
  const localConnector = new Connector();
  try {
    const clientOpts = await localConnector.getOptions({
      instanceConnectionName: getInstanceConnectionName(),
      ipType: IpAddressTypes[getDbIpType()],
      authType: AuthTypes.PASSWORD,
    });
    const conn = await mysql.createConnection({
      ...clientOpts,
      user: credentials.user,
      password: credentials.password,
      database: credentials.database,
      multipleStatements: true,
    });
    try {
      return await fn(conn);
    } finally {
      await conn.end();
    }
  } finally {
    localConnector.close();
  }
}

async function migrate() {
  await withAdminConnection(async (conn, database) => {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  });

  await withAppConnection(async (conn) => {
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
  });
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrate };
