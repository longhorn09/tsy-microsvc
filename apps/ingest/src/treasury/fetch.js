'use strict';

const { ARCHIVE_CSV_URL, XML_BASE_URL } = require('./constants');
const { parseCsv, parseXml, dedupeByDate } = require('./parse');

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: '*/*',
      'User-Agent': 'tsy-microsvc-ingest/1.0',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

async function fetchArchiveRows() {
  console.log(`Downloading archive CSV: ${ARCHIVE_CSV_URL}`);
  const text = await fetchText(ARCHIVE_CSV_URL);
  const rows = parseCsv(text);
  console.log(`Parsed ${rows.length} archive rows`);
  return rows;
}

async function fetchYearXmlRows(year) {
  const url = `${XML_BASE_URL}?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`;
  console.log(`Downloading XML for ${year}: ${url}`);
  const text = await fetchText(url);
  const rows = parseXml(text);
  console.log(`Parsed ${rows.length} rows for ${year}`);
  return rows;
}

/**
 * Fetch XML for each year from startYear through current year (inclusive).
 * Used to cover post-archive years and for recent-day sync.
 */
async function fetchXmlYears(startYear, endYear = new Date().getUTCFullYear()) {
  const all = [];
  for (let year = startYear; year <= endYear; year += 1) {
    const rows = await fetchYearXmlRows(year);
    all.push(...rows);
  }
  return dedupeByDate(all);
}

module.exports = {
  fetchArchiveRows,
  fetchYearXmlRows,
  fetchXmlYears,
};
