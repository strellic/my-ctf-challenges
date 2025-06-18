cp -r chall babyleak
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf babyleak.tar.gz babyleak
rm -rf babyleak