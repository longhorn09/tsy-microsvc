'use strict';

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
  quiet: true,
});

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing required env var: DATABASE_URL');
  }
  return url;
}

module.exports = {
  getDatabaseUrl,
};
