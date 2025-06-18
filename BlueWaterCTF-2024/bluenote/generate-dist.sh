#!/bin/sh

rm dist/bluenote.zip
cp -r challenge bluenote
find bluenote -exec touch --date=@0 {} +
zip -r dist/bluenote.zip bluenote
rm -rf bluenote