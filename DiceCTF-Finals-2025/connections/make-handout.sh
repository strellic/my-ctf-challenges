#!/bin/sh
cp -r chall connections
rm connections.tar.gz
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf connections.tar.gz connections
rm -rf connections