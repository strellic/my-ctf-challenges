#!/bin/sh
cp -r chall dicepass
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf dicepass.tar.gz dicepass
rm -rf dicepass