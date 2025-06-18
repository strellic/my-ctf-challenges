FROM nginx:alpine

COPY index.html /usr/share/nginx/html/

RUN mkdir -p /etc/nginx/conf.d
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80