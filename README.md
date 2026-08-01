# tsy-microsvc

Node.js monorepo for US Treasury par yield curve data:

1. **`apps/ingest`** — seed Cloud SQL MySQL from Treasury archive CSVs (1990+) and run a daily upsert of the last N days  
2. **`apps/api`** — REST JSON microservice that serves yields to other apps  
3. **`packages/db`** — shared MySQL schema, migrations, and query helpers  

## Setup

```bash
npm install
cp .env.example .env
# edit .env with your MySQL / Cloud SQL credentials
npm run db:migrate
```

## Ingest

One-time historical seed (archive CSV 1990–2023 + XML for 2024→today):

```bash
npm run ingest:seed
```

Daily upsert (default last 7 calendar days; intended for Cloud Scheduler → Cloud Run Job):

```bash
npm run ingest:sync
npm run ingest:sync -- --days 7
```

## API

```bash
npm start
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/v1/yields/latest` | Most recent trading day |
| GET | `/v1/yields?from=YYYY-MM-DD&to=YYYY-MM-DD` | Date range |
| GET | `/v1/yields/:date` | Single date |

Example response:

```json
{
  "date": "2026-07-31",
  "yields": {
    "1_mo": 3.72,
    "1_5_mo": 3.71,
    "2_mo": 3.66,
    "3_mo": 3.65,
    "4_mo": 3.62,
    "6_mo": 3.58,
    "1_yr": 3.47,
    "2_yr": 3.47,
    "3_yr": 3.55,
    "5_yr": 3.74,
    "7_yr": 3.95,
    "10_yr": 4.19,
    "20_yr": 4.81,
    "30_yr": 4.86
  },
  "updated_at": "2026-08-01T19:00:00.000Z"
}
```

## Data sources

- Archive CSV: [Daily Treasury Rate Archives](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rate-archives) (`yield-curve-rates-1990-2023.csv`)
- Current / recent years: [Treasury Daily Interest Rate XML Feed](https://home.treasury.gov/treasury-daily-interest-rate-xml-feed)

## Layout

```text
apps/ingest/     seed + daily sync job
apps/api/        Express REST service
packages/db/     MySQL schema + shared access
```

## GCP (next)

- **Cloud SQL (MySQL)** — database  
- **Cloud Run Job** — `npm run ingest:sync`  
- **Cloud Scheduler** — daily cron triggering the job  
- **Cloud Run service** — `npm start` for the API  
