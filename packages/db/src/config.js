'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    namedPlaceholders: true,
    dateStrings: ['DATE'],
  };
}

module.exports = { getDbConfig };
