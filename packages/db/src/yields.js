'use strict';

const { and, asc, desc, eq, gte, lte, sql } = require('drizzle-orm');
const { getDb } = require('./client');
const {
  TENOR_COLUMNS,
  TENOR_COLUMN_TO_FIELD,
  treasuryYields,
} = require('./schema');

function toNumericStringOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : null;
}

function normalizeRow(row) {
  const out = {
    rateDate: row.rate_date,
  };
  for (const col of TENOR_COLUMNS) {
    out[TENOR_COLUMN_TO_FIELD[col]] = toNumericStringOrNull(row[col]);
  }
  return out;
}

function conflictUpdateSet() {
  const set = {
    updatedAt: sql`CURRENT_TIMESTAMP`,
  };
  for (const col of TENOR_COLUMNS) {
    set[TENOR_COLUMN_TO_FIELD[col]] = sql.raw(`excluded.${col}`);
  }
  return set;
}

async function upsertYields(rows, { batchSize = 200 } = {}) {
  if (!rows.length) {
    return { upserted: 0 };
  }

  const db = getDb();
  const set = conflictUpdateSet();

  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize).map(normalizeRow);
      await tx
        .insert(treasuryYields)
        .values(chunk)
        .onConflictDoUpdate({
          target: treasuryYields.rateDate,
          set,
        });
    }
  });

  return { upserted: rows.length };
}

async function getLatestYield() {
  const db = getDb();
  const rows = await db
    .select()
    .from(treasuryYields)
    .orderBy(desc(treasuryYields.rateDate))
    .limit(1);
  return rows[0] || null;
}

async function getYieldByDate(rateDate) {
  const db = getDb();
  const rows = await db
    .select()
    .from(treasuryYields)
    .where(eq(treasuryYields.rateDate, rateDate))
    .limit(1);
  return rows[0] || null;
}

async function getYieldsInRange(from, to) {
  const db = getDb();
  return db
    .select()
    .from(treasuryYields)
    .where(
      and(gte(treasuryYields.rateDate, from), lte(treasuryYields.rateDate, to))
    )
    .orderBy(asc(treasuryYields.rateDate));
}

function asNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatDate(value) {
  if (!value) return value;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatTimestamp(value) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

/** Preserve the public API JSON shape used by downstream consumers. */
function toApiYield(row) {
  if (!row) return null;
  return {
    date: formatDate(row.rateDate),
    yields: {
      '1_mo': asNumberOrNull(row.y1Mo),
      '1_5_mo': asNumberOrNull(row.y15Mo),
      '2_mo': asNumberOrNull(row.y2Mo),
      '3_mo': asNumberOrNull(row.y3Mo),
      '4_mo': asNumberOrNull(row.y4Mo),
      '6_mo': asNumberOrNull(row.y6Mo),
      '1_yr': asNumberOrNull(row.y1Yr),
      '2_yr': asNumberOrNull(row.y2Yr),
      '3_yr': asNumberOrNull(row.y3Yr),
      '5_yr': asNumberOrNull(row.y5Yr),
      '7_yr': asNumberOrNull(row.y7Yr),
      '10_yr': asNumberOrNull(row.y10Yr),
      '20_yr': asNumberOrNull(row.y20Yr),
      '30_yr': asNumberOrNull(row.y30Yr),
    },
    updated_at: formatTimestamp(row.updatedAt),
  };
}

module.exports = {
  TENOR_COLUMNS,
  upsertYields,
  getLatestYield,
  getYieldByDate,
  getYieldsInRange,
  toApiYield,
};
