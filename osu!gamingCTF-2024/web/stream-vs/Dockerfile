FROM node:20-buster-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

COPY public ./public
COPY songs.json app.js ./

CMD ["node", "app.js"]