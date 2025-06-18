#!/bin/sh
docker build . -t web_bluenote
docker run --rm -it -p 1337:1337 --name web_bluenote web_bluenote