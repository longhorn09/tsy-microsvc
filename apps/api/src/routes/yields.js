'use strict';

const express = require('express');
const {
  getLatestYield,
  getYieldByDate,
  getYieldsInRange,
  toApiYield,
} = require('@tsy/db');

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

router.get('/latest', async (req, res, next) => {
  try {
    const row = await getLatestYield();
    if (!row) {
      return res.status(404).json({ error: 'No yield data found' });
    }
    return res.json(toApiYield(row));
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({
        error: 'Query params from and to are required (YYYY-MM-DD)',
      });
    }
    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ error: 'from and to must be YYYY-MM-DD' });
    }
    if (from > to) {
      return res.status(400).json({ error: 'from must be <= to' });
    }

    const rows = await getYieldsInRange(from, to);
    return res.json({
      from,
      to,
      count: rows.length,
      data: rows.map(toApiYield),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const row = await getYieldByDate(date);
    if (!row) {
      return res.status(404).json({ error: `No yield data for ${date}` });
    }
    return res.json(toApiYield(row));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
