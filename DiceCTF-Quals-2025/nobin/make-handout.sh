#!/bin/sh
cp -r chall nobin
rm nobin.tar.gz
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf nobin.tar.gz nobin
rm -rf nobin