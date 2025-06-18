cp -r challenge safestlist
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf safestlist.tar.gz safestlist
rm -rf safestlist