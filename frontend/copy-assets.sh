#!/bin/bash

echo "Cleaning old assets."
rm -rf ../authstats/static/authstats/bs3/assets
rm ../authstats/static/authstats/bs3/manifest.json
echo "Copying new assets."
cp build/static/.vite/manifest.json ../authstats/static/authstats/bs3/manifest.json
cp -r build/static/assets ../authstats/static/authstats/bs3/assets
echo "Assets copied successfully."
