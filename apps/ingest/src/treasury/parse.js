'use strict';

const { parse } = require('csv-parse/sync');
const { XMLParser } = require('fast-xml-parser');
const { CSV_HEADER_MAP, XML_FIELD_MAP } = require('./constants');

function parseRate(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === 'null') return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

/** Accepts MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD → YYYY-MM-DD */
function normalizeDate(value) {
  if (!value) return null;
  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;

  let [, month, day, year] = m;
  if (year.length === 2) {
    // Treasury archive uses 2-digit years; 90–99 → 1990s, else 2000s.
    year = Number(year) >= 90 ? `19${year}` : `20${year.padStart(2, '0')}`;
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function emptyRow() {
  return {
    rate_date: null,
    y_1_mo: null,
    y_1_5_mo: null,
    y_2_mo: null,
    y_3_mo: null,
    y_4_mo: null,
    y_6_mo: null,
    y_1_yr: null,
    y_2_yr: null,
    y_3_yr: null,
    y_5_yr: null,
    y_7_yr: null,
    y_10_yr: null,
    y_20_yr: null,
    y_30_yr: null,
  };
}

function parseCsv(text) {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const rows = [];
  for (const record of records) {
    const row = emptyRow();
    for (const [header, value] of Object.entries(record)) {
      const col = CSV_HEADER_MAP[header.trim()];
      if (!col) continue;
      if (col === 'rate_date') {
        row.rate_date = normalizeDate(value);
      } else {
        row[col] = parseRate(value);
      }
    }
    if (row.rate_date) rows.push(row);
  }
  return rows;
}

function localName(key) {
  if (!key) return key;
  const parts = String(key).split(':');
  return parts[parts.length - 1];
}

function flattenProperties(properties) {
  const flat = {};
  if (!properties || typeof properties !== 'object') return flat;

  for (const [key, value] of Object.entries(properties)) {
    const name = localName(key);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // fast-xml-parser may wrap text as { '#text': '...' } or attrs
      if ('#text' in value) {
        flat[name] = value['#text'];
      } else {
        flat[name] = value;
      }
    } else {
      flat[name] = value;
    }
  }
  return flat;
}

function parseXml(text) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (name) => name === 'entry',
  });

  const doc = parser.parse(text);
  const feed = doc.feed || doc;
  const entries = feed.entry || [];
  const list = Array.isArray(entries) ? entries : [entries];

  const rows = [];
  for (const entry of list) {
    const properties =
      entry?.content?.properties ||
      entry?.content?.['m:properties'] ||
      entry?.content ||
      {};
    const flat = flattenProperties(properties);
    const row = emptyRow();

    for (const [field, col] of Object.entries(XML_FIELD_MAP)) {
      const value = flat[field];
      if (col === 'rate_date') {
        row.rate_date = normalizeDate(value);
      } else {
        row[col] = parseRate(value);
      }
    }

    if (row.rate_date) rows.push(row);
  }

  return rows;
}

function dedupeByDate(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.rate_date, row);
  }
  return [...map.values()].sort((a, b) => a.rate_date.localeCompare(b.rate_date));
}

function filterByDateRange(rows, fromDate, toDate) {
  return rows.filter((row) => {
    if (fromDate && row.rate_date < fromDate) return false;
    if (toDate && row.rate_date > toDate) return false;
    return true;
  });
}

module.exports = {
  parseCsv,
  parseXml,
  normalizeDate,
  dedupeByDate,
  filterByDateRange,
};
