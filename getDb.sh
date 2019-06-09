#!/bin/bash
set -x

FILE="voyager-index-data.json.tar.gz"
URL="https://liambeckman.com/pkgs/voyager-index-data"
COLOR='\033[1;36m'
NC='\033[0m' # No Color

printf "${COLOR}cleaning old database copies${NC}\n"
rm -rf "./$FILE"*

printf "${COLOR}retrieving database${NC}\n"
wget "$URL/$FILE"

printf "${COLOR}unpacking database${NC}\n"
tar -zxvf "$FILE"
