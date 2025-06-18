FROM alpine:latest

RUN adduser -D -u 1000 -g 1000 -s /bin/sh www

RUN apk add --no-cache --update python3 py3-pip

WORKDIR /app

COPY . .

RUN python3 -m pip install --no-cache-dir --break-system-packages -r requirements.txt

RUN chown -R www:www /app

USER www

CMD ["gunicorn", "-w", "10", "-b", "0.0.0.0:3000", "app:app"]