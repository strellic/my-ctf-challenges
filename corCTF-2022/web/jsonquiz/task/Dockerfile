FROM node:18.1.0-bullseye-slim
WORKDIR /app
COPY package.json ./
COPY static ./static
RUN npm i
COPY app.js .
CMD ["node", "app.js"]
