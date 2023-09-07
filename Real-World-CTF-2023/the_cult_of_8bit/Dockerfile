FROM node as bot_env
COPY ./bot/bot.js /bot/bot.js
WORKDIR /bot
RUN npm i puppeteer
RUN npm i redis

FROM node

ENV REDIS_PASSWORD=IVK3IEYCO4Q7jzLs8hJi \ 
    ADMIN_PASSWORD=Su2Tv8roEu77H6R8xFBe \
    FLAG=rwctf{val3ntina_e5c4ped_th3_cu1t_with_l33t_op3ner}

# Recaptcha keys
# ENV RECAPTCHA_SITE_KEY=SITE_KEY \
#     RECAPTCHA_SECRET_KEY=SECRET_KEY

RUN apt update && \
    apt install libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 redis-server -y && \
    echo "requirepass ${REDIS_PASSWORD}" >> /etc/redis/redis.conf 

COPY ./code /app
COPY ./setup.sh /app/setup.sh
COPY --from=bot_env /bot /bot
COPY --from=bot_env /root/.cache /root/.cache

WORKDIR /app

RUN npm i

EXPOSE 12345

CMD ["sh","-c","chmod +x ./setup.sh && ./setup.sh"]
