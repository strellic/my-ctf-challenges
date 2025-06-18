#!/bin/sh
docker build . -t nobin
docker container rm -f nobin
docker run --rm -p 3000:3000 --name nobin nobin