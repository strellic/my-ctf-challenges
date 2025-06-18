FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y openssl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

COPY . .

CMD ["node", "app.js"]