'use strict';

const crypto = require('crypto');

function readBearerOrApiKey(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(\S+)/i);
  if (match) return match[1];
  const apiKey = req.get('x-api-key');
  return apiKey ? apiKey.trim() : '';
}

function secretsEqual(provided, expected) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res, next) {
  const expected = process.env.API_SECRET;
  if (!expected) {
    return res.status(500).json({ error: 'API_SECRET is not configured' });
  }

  const provided = readBearerOrApiKey(req);
  if (!provided || !secretsEqual(provided, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

module.exports = requireAuth;
