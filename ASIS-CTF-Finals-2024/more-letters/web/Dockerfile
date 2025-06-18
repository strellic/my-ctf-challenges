FROM node:20-buster-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm i

COPY . .

RUN useradd -m app

USER app

CMD ["node", "index.js"]