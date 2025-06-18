#!/bin/sh
docker build . -t stream-vs
docker container rm -f stream-vs
docker run --rm -p 1727:1727 --name stream-vs stream-vs