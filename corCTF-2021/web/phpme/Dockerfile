FROM alpine:latest

RUN adduser -D -u 1000 -g 1000 -s /bin/sh www

RUN apk add --no-cache --update php7-fpm php7-json supervisor nginx

COPY config/fpm.conf /etc/php7/php-fpm.d/www.conf
COPY config/supervisord.conf /etc/supervisord.conf
COPY config/nginx.conf /etc/nginx/nginx.conf

COPY challenge /www

RUN chown -R www:www /var/lib/nginx

EXPOSE 80

CMD /usr/bin/supervisord -c /etc/supervisord.conf