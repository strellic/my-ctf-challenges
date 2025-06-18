FROM node:20-buster-slim

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

CMD ["node", "app.js"]