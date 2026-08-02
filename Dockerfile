#FROM node:22-slim
FROM node:lts-slim

WORKDIR /tsy-microsvc

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/ingest/package.json ./apps/ingest/
COPY packages/db/package.json ./packages/db/

RUN npm ci --omit=dev

COPY apps/api ./apps/api
COPY packages/db ./packages/db

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "run", "start", "-w", "@tsy/api"]
