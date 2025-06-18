#!/bin/sh
docker build . -t dicepass
docker run --rm -it -p3000:3000 --name dicepass dicepass