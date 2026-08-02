'use strict';

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
  quiet: true,
});

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function useCloudSqlConnector() {
  return Boolean(process.env.INSTANCE_CONNECTION_NAME);
}

function getInstanceConnectionName() {
  return process.env.INSTANCE_CONNECTION_NAME || null;
}

/** PUBLIC (default) | PRIVATE | PSC — matches Cloud SQL connector IpAddressTypes */
function getDbIpType() {
  const raw = (process.env.DB_IP_TYPE || 'PUBLIC').toUpperCase();
  if (!['PUBLIC', 'PRIVATE', 'PSC'].includes(raw)) {
    throw new Error(`Invalid DB_IP_TYPE: ${raw}. Use PUBLIC, PRIVATE, or PSC.`);
  }
  return raw;
}

function getDbCredentials() {
  return {
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    namedPlaceholders: true,
    dateStrings: ['DATE'],
  };
}

/** Direct TCP config (local MySQL or Cloud SQL public IP). */
function getDbConfig() {
  return {
    ...getDbCredentials(),
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
  };
}

module.exports = {
  getDbConfig,
  getDbCredentials,
  useCloudSqlConnector,
  getInstanceConnectionName,
  getDbIpType,
};
