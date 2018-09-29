#!/usr/bin/env bash

npm install
npm install -g pkg

pkg -t node9-linux -o ./bitter dist/server.bundle.js

rm package.json
rm package-lock.json
rm -rf dist
rm `basename "$0"`
