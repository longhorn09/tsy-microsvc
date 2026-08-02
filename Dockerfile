FROM node:lts-slim

WORKDIR /tsy-microsvc

# check for package.json changes first, if none then skip the npm ci
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/ingest/package.json ./apps/ingest/
COPY packages/db/package.json ./packages/db/

# note: ci means clean install
RUN npm ci --omit=dev

# copy the actual source code
COPY apps/api ./apps/api
# need this for the synch service
COPY apps/ingest ./apps/ingest  
COPY packages/db ./packages/db

ENV NODE_ENV=production
EXPOSE 8080

# npm as PID 1 does not forward SIGTERM reliably on Cloud Run
# CMD ["npm", "run", "start", "-w", "@tsy/api"]
CMD ["node", "apps/api/src/index.js"]
