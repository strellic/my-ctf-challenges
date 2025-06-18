#!/bin/sh
docker build . -t msfrogofwar3
docker run --rm -it -p 8080:8080 -e FLAG=corctf{real_flag} --name msfrogofwar3 msfrogofwar3