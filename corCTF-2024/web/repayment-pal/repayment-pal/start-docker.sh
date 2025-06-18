#!/bin/sh
docker build . -t repayment-pal
docker run --rm -it -p3000:3000 --name repayment-pal repayment-pal
