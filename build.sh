#!/usr/bin/env bash

###############
rm -rf build
mkdir build
rm bitter.tar.gz
rm -rf server/dist
cd server && npm run build-prod && cd ..
###############
cp -R server/package.json ./build
cp -R server/.env ./build
cp -R server/dist ./build
cp bin.sh ./build
###############
tar zcvf bitter.tar.gz build
