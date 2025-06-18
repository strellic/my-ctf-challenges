#!/bin/sh

# install CA certificate
cp /certs/ca.crt /usr/local/share/ca-certificates/ca.crt
chmod 644 /usr/local/share/ca-certificates/ca.crt && update-ca-certificates
mkdir -p /root/.pki/nssdb
certutil -N --empty-password -d sql:/root/.pki/nssdb
certutil -d sql:/root/.pki/nssdb -A -t "C,," -n asis -i /usr/local/share/ca-certificates/ca.crt

# start the bot
node index.js