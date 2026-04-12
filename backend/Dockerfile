FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "echo '[boot] Running migrations...' && npx prisma migrate deploy && echo '[boot] Seeding admin...' && npx ts-node prisma/seed-prod.ts && echo '[boot] Starting server...' && node dist/server.js"]
