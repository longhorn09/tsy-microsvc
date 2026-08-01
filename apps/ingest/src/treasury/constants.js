'use strict';

/** Official Treasury archive covering 1990–2023 par yield curve rates. */
const ARCHIVE_CSV_URL =
  'https://home.treasury.gov/system/files/276/yield-curve-rates-1990-2023.csv';

const XML_BASE_URL =
  'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml';

/** CSV header → DB column */
const CSV_HEADER_MAP = {
  Date: 'rate_date',
  '1 Mo': 'y_1_mo',
  '1.5 Mo': 'y_1_5_mo',
  '2 Mo': 'y_2_mo',
  '3 Mo': 'y_3_mo',
  '4 Mo': 'y_4_mo',
  '6 Mo': 'y_6_mo',
  '1 Yr': 'y_1_yr',
  '2 Yr': 'y_2_yr',
  '3 Yr': 'y_3_yr',
  '5 Yr': 'y_5_yr',
  '7 Yr': 'y_7_yr',
  '10 Yr': 'y_10_yr',
  '20 Yr': 'y_20_yr',
  '30 Yr': 'y_30_yr',
};

/** XML field → DB column */
const XML_FIELD_MAP = {
  NEW_DATE: 'rate_date',
  BC_1MONTH: 'y_1_mo',
  BC_1_5MONTH: 'y_1_5_mo',
  BC_2MONTH: 'y_2_mo',
  BC_3MONTH: 'y_3_mo',
  BC_4MONTH: 'y_4_mo',
  BC_6MONTH: 'y_6_mo',
  BC_1YEAR: 'y_1_yr',
  BC_2YEAR: 'y_2_yr',
  BC_3YEAR: 'y_3_yr',
  BC_5YEAR: 'y_5_yr',
  BC_7YEAR: 'y_7_yr',
  BC_10YEAR: 'y_10_yr',
  BC_20YEAR: 'y_20_yr',
  BC_30YEAR: 'y_30_yr',
};

module.exports = {
  ARCHIVE_CSV_URL,
  XML_BASE_URL,
  CSV_HEADER_MAP,
  XML_FIELD_MAP,
};
