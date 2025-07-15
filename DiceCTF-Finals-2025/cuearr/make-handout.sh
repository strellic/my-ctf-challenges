#!/bin/sh
cp -r chall cuearr
rm cuearr.tar.gz
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf cuearr.tar.gz cuearr
rm -rf cuearr