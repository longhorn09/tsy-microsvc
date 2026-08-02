'use strict';

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
  quiet: true,
});

const { getPool, closePool, upsertYields } = require('@tsy/db');
const { fetchXmlYears } = require('./treasury/fetch');
const { filterByDateRange } = require('./treasury/parse');

function parseArgs(argv) {
  let days = Number(process.env.SYNC_DAYS || 7);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--days' && argv[i + 1]) {
      days = Number(argv[i + 1]);
      i += 1;
    }
  }
  if (!Number.isFinite(days) || days < 1) {
    throw new Error(`Invalid --days value: ${days}`);
  }
  return { days };
}

function isoDateUTC(date) {
  return date.toISOString().slice(0, 10);
}

async function sync() {
  const { days } = parseArgs(process.argv.slice(2));
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const fromDate = isoDateUTC(from);
  const toDate = isoDateUTC(to);
  const startYear = from.getUTCFullYear();

  console.log(`Syncing treasury yields from ${fromDate} to ${toDate} (${days} days)...`);

  const yearRows = await fetchXmlYears(startYear);
  const rows = filterByDateRange(yearRows, fromDate, toDate);

  console.log(`Upserting ${rows.length} rows...`);
  const pool = await getPool();
  const { upserted } = await upsertYields(pool, rows);
  console.log(`Sync complete. Upserted ${upserted} rows.`);
}

sync()
  .catch((err) => {
    console.error('Sync failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
