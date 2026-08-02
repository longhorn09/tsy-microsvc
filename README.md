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

## Deploy API to Cloud Run

These steps deploy `apps/api` as a Cloud Run service using `@google-cloud/cloud-sql-connector` (set `INSTANCE_CONNECTION_NAME` + `DB_IP_TYPE=PUBLIC`). Replace `PROJECT_ID`, `REGION`, and the connection name with your values.

### 0. Prerequisites (one-time)

```bash
gcloud config set project PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com
```

Confirm auth: `gcloud auth list`

### 1. Container files

The repo includes a root `Dockerfile` and `.dockerignore`. Do not bake `.env` into the image; Cloud Run injects env vars and secrets.

### 2. Service account

```bash
gcloud iam service-accounts create tsy-api-runner \
  --display-name="Treasury Yields API Cloud Run"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:tsy-api-runner@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:tsy-api-runner@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. DB secrets in Secret Manager

Run from the project root (where `.env` lives). These pipe values from `.env` into Secret Manager:

```bash
# For DB_USER
grep '^DB_USER=' .env | cut -d'=' -f2- | tr -d '\r\n' | gcloud secrets create tsy-db-user --data-file=-

# For DB_PASSWORD
grep '^DB_PASSWORD=' .env | cut -d'=' -f2- | tr -d '\r\n' | gcloud secrets create tsy-db-password --data-file=-

# For DB_NAME
grep '^DB_NAME=' .env | cut -d'=' -f2- | tr -d '\r\n' | gcloud secrets create tsy-db-name --data-file=-
```

To update an existing secret later:

```bash
grep '^DB_PASSWORD=' .env | cut -d'=' -f2- | tr -d '\r\n' | gcloud secrets versions add tsy-db-password --data-file=-
```

### 4. Deploy

From the repo root:

```bash
gcloud run deploy tsy-api \
  --source . \
  --region REGION \
  --service-account tsy-api-runner@PROJECT_ID.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars "INSTANCE_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME,DB_IP_TYPE=PUBLIC,HOST=0.0.0.0" \
  --set-secrets "DB_USER=tsy-db-user:latest,DB_PASSWORD=tsy-db-password:latest,DB_NAME=tsy-db-name:latest" \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3
```

Cloud Run sets `PORT` (usually `8080`); the API already reads `process.env.PORT`. With the connector and `PUBLIC` IP, you do not need `--add-cloudsql-instances` or authorized networks for this path.

### 5. Verify

```bash
gcloud run services describe tsy-api --region REGION --format='value(status.url)'

curl -s "$(gcloud run services describe tsy-api --region REGION --format='value(status.url)')/health"

curl -s "$(gcloud run services describe tsy-api --region REGION --format='value(status.url)')/v1/yields/latest"

curl -s "$(gcloud run services describe tsy-api --region REGION --format='value(status.url)')/v1/yields?from=2026-07-01&to=2026-07-31"
```

Logs:

```bash
gcloud run services logs read tsy-api --region REGION --limit 50
```

You should see a line like: `Using Cloud SQL connector (PUBLIC) for PROJECT_ID:REGION:INSTANCE_NAME`

### Keep `tsy-sync` Job on the same image as `tsy-api`

Cloud Run pins an image digest when a Service/Job is updated. The original console trigger only redeployed `tsy-api`. Repo root [`cloudbuild.yaml`](cloudbuild.yaml) builds once, updates the API service, then updates Job `tsy-sync` to the same `$COMMIT_SHA` image (Job command/env/secrets are left alone).

One-time: point the existing GitHub → `main` trigger at that file (export → set `filename: cloudbuild.yaml` → import), e.g.:

```bash
gcloud beta builds triggers export 4feca7dd-13c6-461b-b80f-a24e1d34dac3 \
  --project=lorebot-prd \
  --destination=/tmp/tsy-trigger.yaml
# edit /tmp/tsy-trigger.yaml: remove inline `build:`, add `filename: cloudbuild.yaml`
gcloud builds triggers import --source=/tmp/tsy-trigger.yaml --project=lorebot-prd
```

Commit `cloudbuild.yaml` to `main` before or with the first push after that change. Cloud Scheduler does not need updates — it only invokes the Job.
