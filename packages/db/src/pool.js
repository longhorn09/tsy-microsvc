'use strict';

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

let pool;
let poolPromise;
let connector;

async function buildPoolOptions() {
  const credentials = getDbCredentials();

  if (!useCloudSqlConnector()) {
    return getDbConfig();
  }

  const instanceConnectionName = getInstanceConnectionName();
  const ipType = IpAddressTypes[getDbIpType()];

  connector = new Connector();
  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    ipType,
    authType: AuthTypes.PASSWORD,
  });

  console.log(
    `Using Cloud SQL connector (${getDbIpType()}) for ${instanceConnectionName}`
  );

  // Connector supplies stream/TLS; do not pass host/port.
  return {
    ...clientOpts,
    ...credentials,
  };
}

async function initPool() {
  if (pool) return pool;
  if (poolPromise) return poolPromise;

  poolPromise = (async () => {
    const options = await buildPoolOptions();
    pool = mysql.createPool(options);
    return pool;
  })().catch((err) => {
    poolPromise = undefined;
    if (connector) {
      connector.close();
      connector = undefined;
    }
    throw err;
  });

  return poolPromise;
}

/** Lazy async pool getter (Cloud SQL connector or direct TCP). */
async function getPool() {
  return initPool();
}

async function closePool() {
  if (poolPromise) {
    try {
      await poolPromise;
    } catch {
      // ignore init failure during shutdown
    }
  }

  if (pool) {
    await pool.end();
    pool = undefined;
  }
  poolPromise = undefined;

  if (connector) {
    connector.close();
    connector = undefined;
  }
}

module.exports = { getPool, initPool, closePool };
