#!/bin/sh
docker build . -t iframe-note
docker run --rm -it -p3000:3000 --name iframe-note -e SECRET_KEY=$(head -c16 /dev/urandom | base64) iframe-note