#!/bin/bash

var=$(./node_modules/.bin/tsc)
echo "$var"
node build/router.js
