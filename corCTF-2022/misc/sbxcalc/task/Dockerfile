FROM node:18.1.0-bullseye-slim
WORKDIR /app
COPY package.json ./
COPY views ./views
RUN npm i
COPY app.js .
CMD ["node", "app.js"]