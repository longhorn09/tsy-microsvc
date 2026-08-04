'use strict';

const { getDatabaseUrl } = require('./config');
const { getDb, initDb, closeDb } = require('./client');
const {
  TENOR_COLUMNS,
  upsertYields,
  getLatestYield,
  getYieldByDate,
  getYieldsInRange,
  toApiYield,
} = require('./yields');
const { treasuryYields } = require('./schema');
const { migrate } = require('./migrate');

module.exports = {
  getDatabaseUrl,
  getDb,
  initDb,
  closeDb,
  // Back-compat aliases used by older call sites during transition
  getPool: getDb,
  initPool: initDb,
  closePool: closeDb,
  TENOR_COLUMNS,
  treasuryYields,
  upsertYields,
  getLatestYield,
  getYieldByDate,
  getYieldsInRange,
  toApiYield,
  migrate,
};
