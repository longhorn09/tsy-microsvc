'use strict';

const TENOR_COLUMNS = [
  'y_1_mo',
  'y_1_5_mo',
  'y_2_mo',
  'y_3_mo',
  'y_4_mo',
  'y_6_mo',
  'y_1_yr',
  'y_2_yr',
  'y_3_yr',
  'y_5_yr',
  'y_7_yr',
  'y_10_yr',
  'y_20_yr',
  'y_30_yr',
];

const UPDATE_CLAUSE = TENOR_COLUMNS.map((c) => `${c} = VALUES(${c})`).join(', ');

function normalizeRow(row) {
  const out = { rate_date: row.rate_date };
  for (const col of TENOR_COLUMNS) {
    const value = row[col];
    out[col] = value === undefined || value === null || value === '' ? null : Number(value);
  }
  return out;
}

function buildBatchUpsert(rows) {
  const cols = ['rate_date', ...TENOR_COLUMNS];
  const placeholders = rows.map(() => `(${cols.map(() => '?').join(', ')})`).join(', ');
  const sql = `
INSERT INTO treasury_yields (${cols.join(', ')})
VALUES ${placeholders}
ON DUPLICATE KEY UPDATE ${UPDATE_CLAUSE}
`;
  const values = [];
  for (const row of rows) {
    const n = normalizeRow(row);
    values.push(n.rate_date, ...TENOR_COLUMNS.map((c) => n[c]));
  }
  return { sql, values };
}

async function upsertYields(pool, rows, { batchSize = 200 } = {}) {
  if (!rows.length) {
    return { upserted: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const { sql, values } = buildBatchUpsert(chunk);
      await conn.query(sql, values);
    }
    await conn.commit();
    return { upserted: rows.length };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getLatestYield(pool) {
  const [rows] = await pool.query(
    `SELECT * FROM treasury_yields ORDER BY rate_date DESC LIMIT 1`
  );
  return rows[0] || null;
}

async function getYieldByDate(pool, rateDate) {
  const [rows] = await pool.execute(
    `SELECT * FROM treasury_yields WHERE rate_date = :rate_date LIMIT 1`,
    { rate_date: rateDate }
  );
  return rows[0] || null;
}

async function getYieldsInRange(pool, from, to) {
  const [rows] = await pool.execute(
    `SELECT * FROM treasury_yields
     WHERE rate_date >= :from_date AND rate_date <= :to_date
     ORDER BY rate_date ASC`,
    { from_date: from, to_date: to }
  );
  return rows;
}

function toApiYield(row) {
  if (!row) return null;
  return {
    date: row.rate_date,
    yields: {
      '1_mo': row.y_1_mo,
      '1_5_mo': row.y_1_5_mo,
      '2_mo': row.y_2_mo,
      '3_mo': row.y_3_mo,
      '4_mo': row.y_4_mo,
      '6_mo': row.y_6_mo,
      '1_yr': row.y_1_yr,
      '2_yr': row.y_2_yr,
      '3_yr': row.y_3_yr,
      '5_yr': row.y_5_yr,
      '7_yr': row.y_7_yr,
      '10_yr': row.y_10_yr,
      '20_yr': row.y_20_yr,
      '30_yr': row.y_30_yr,
    },
    updated_at: row.updated_at,
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
