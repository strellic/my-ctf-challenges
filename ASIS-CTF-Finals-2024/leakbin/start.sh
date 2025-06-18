#!/bin/sh
docker build . -t web_leakbin
docker run --rm -it -p 3000:3000 --name web_leakbin web_leakbin