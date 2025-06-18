FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

COPY . .

CMD ["node", "app.js"]