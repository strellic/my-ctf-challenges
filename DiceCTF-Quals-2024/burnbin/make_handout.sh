cp -r challenge burnbin
cp fake_flag.png burnbin/flag.png
tar --owner="strell" --group="strell" -H v7 --no-xattr --mtime=1970-01-01T00:00Z -czvf burnbin.tar.gz burnbin
rm -rf burnbin