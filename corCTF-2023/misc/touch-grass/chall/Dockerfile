FROM node:18.16.1-bullseye-slim

WORKDIR /app

COPY package.json ./

RUN npm i

COPY . .

CMD ["node", "app.js"]