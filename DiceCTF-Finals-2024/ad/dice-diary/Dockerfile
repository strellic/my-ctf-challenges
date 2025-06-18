FROM node:20-buster-slim

RUN apt-get update \
    && apt-get install -y openssl openssh-server supervisor \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ARG ROOT_PASSWORD
ARG ADMIN_PASSWORD

COPY supervisord.conf /etc/supervisord.conf
COPY start.sh /

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

COPY . .

WORKDIR /app/src
RUN npm run prisma-generate
RUN npm run prisma-push

WORKDIR /app
RUN npm run build

RUN chown node:node -R /app

EXPOSE 3000

CMD ["/start.sh"]
