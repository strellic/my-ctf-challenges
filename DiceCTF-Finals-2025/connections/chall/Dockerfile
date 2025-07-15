FROM node:22-bullseye-slim

COPY package.json package-lock.json ./
RUN npm i

COPY . .

RUN useradd -ms /bin/bash user
USER user

CMD ["npm", "run", "start"]