#!/bin/sh

ROOT_PASSWORD=$(openssl rand -hex 32)
ADMIN_PASSWORD=$(openssl rand -hex 32)

echo "root SSH password: $ROOT_PASSWORD"
echo "admin account password: $ADMIN_PASSWORD"

docker build . -t dice-diary --build-arg "ROOT_PASSWORD=$ROOT_PASSWORD" --build-arg "ADMIN_PASSWORD=$ADMIN_PASSWORD"
docker container rm -f dice-diary
docker run --rm -it -p22:22 -p3000:3000 --name dice-diary dice-diary
