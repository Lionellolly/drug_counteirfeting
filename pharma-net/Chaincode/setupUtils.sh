#!/bin/sh

echo "Updating Node and NPM versions to a stable version......."
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

echo "Updating Ubuntu.............."
apt-get update

echo "Installing nano editor......."
apt-get install nano

# echo "Installing NPM Modules......."
# npm install 
