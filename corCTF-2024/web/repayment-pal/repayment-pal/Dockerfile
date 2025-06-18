FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y openssl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

COPY . .

WORKDIR /app/src
RUN npm run prisma-generate
RUN npm run prisma-push

WORKDIR /app

ENV DATABASE_URL=file:./db.sqlite3

CMD ["npm", "run", "dev"]