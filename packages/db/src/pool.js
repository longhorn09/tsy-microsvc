'use strict';

const mysql = require('mysql2/promise');
const { getDbConfig } = require('./config');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(getDbConfig());
  }
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { getPool, closePool };
