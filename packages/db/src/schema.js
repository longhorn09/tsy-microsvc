'use strict';

const { pgTable, date, numeric, timestamp } = require('drizzle-orm/pg-core');

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

/** Matches the existing Neon `public.treasury_yields` table. */
const treasuryYields = pgTable('treasury_yields', {
  rateDate: date('rate_date').primaryKey(),
  y1Mo: numeric('y_1_mo', { precision: 6, scale: 2 }),
  y15Mo: numeric('y_1_5_mo', { precision: 6, scale: 2 }),
  y2Mo: numeric('y_2_mo', { precision: 6, scale: 2 }),
  y3Mo: numeric('y_3_mo', { precision: 6, scale: 2 }),
  y4Mo: numeric('y_4_mo', { precision: 6, scale: 2 }),
  y6Mo: numeric('y_6_mo', { precision: 6, scale: 2 }),
  y1Yr: numeric('y_1_yr', { precision: 6, scale: 2 }),
  y2Yr: numeric('y_2_yr', { precision: 6, scale: 2 }),
  y3Yr: numeric('y_3_yr', { precision: 6, scale: 2 }),
  y5Yr: numeric('y_5_yr', { precision: 6, scale: 2 }),
  y7Yr: numeric('y_7_yr', { precision: 6, scale: 2 }),
  y10Yr: numeric('y_10_yr', { precision: 6, scale: 2 }),
  y20Yr: numeric('y_20_yr', { precision: 6, scale: 2 }),
  y30Yr: numeric('y_30_yr', { precision: 6, scale: 2 }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

const TENOR_COLUMN_TO_FIELD = {
  y_1_mo: 'y1Mo',
  y_1_5_mo: 'y15Mo',
  y_2_mo: 'y2Mo',
  y_3_mo: 'y3Mo',
  y_4_mo: 'y4Mo',
  y_6_mo: 'y6Mo',
  y_1_yr: 'y1Yr',
  y_2_yr: 'y2Yr',
  y_3_yr: 'y3Yr',
  y_5_yr: 'y5Yr',
  y_7_yr: 'y7Yr',
  y_10_yr: 'y10Yr',
  y_20_yr: 'y20Yr',
  y_30_yr: 'y30Yr',
};

module.exports = {
  TENOR_COLUMNS,
  TENOR_COLUMN_TO_FIELD,
  treasuryYields,
};
