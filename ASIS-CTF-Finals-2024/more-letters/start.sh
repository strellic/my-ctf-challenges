#!/bin/sh

# generate self-signed certificate

# remove existing certs
if [ -d "certs" ]; then
  rm -rf ./certs
fi
mkdir certs && cd certs

# create CA key and cert
openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout ca.key \
    -out ca.crt \
    -days 1024 \
    -subj "/CN=ASIS"

# create site key and CSR
openssl req -newkey rsa:4096 -nodes \
    -keyout site.key \
    -out site.csr \
    -subj "/CN=web" \
    -addext "subjectAltName=DNS:web"

# create extension file and sign the certificate
echo "subjectAltName=DNS:web" > extfile.cnf && \
    openssl x509 -req \
    -in site.csr \
    -CA ca.crt \
    -CAkey ca.key \
    -CAcreateserial \
    -out site.crt \
    -days 1024 \
    -extfile extfile.cnf && \
    rm extfile.cnf

chmod 777 site.key site.crt

cd ..
docker compose up --build