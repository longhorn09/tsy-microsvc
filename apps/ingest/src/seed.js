'use strict';

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
  quiet: true,
});

const { getPool, closePool, upsertYields } = require('@tsy/db');
const { fetchArchiveRows, fetchXmlYears } = require('./treasury/fetch');
const { dedupeByDate } = require('./treasury/parse');

async function seed() {
  const archiveRows = await fetchArchiveRows();

  // Archives end at 2023; pull XML from 2024 through the current year.
  const xmlRows = await fetchXmlYears(2024);
  const rows = dedupeByDate([...archiveRows, ...xmlRows]);

  console.log(`Upserting ${rows.length} total rows into Cloud SQL / MySQL...`);
  const pool = getPool();
  const { upserted } = await upsertYields(pool, rows);
  console.log(`Seed complete. Upserted ${upserted} rows.`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
