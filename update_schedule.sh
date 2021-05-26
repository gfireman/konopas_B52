#!/bin/bash

# setups
kondir=$(dirname "${BASH_SOURCE[0]}")
jsonfile=balticon55.json
manifest=konopas.appcache
timestamp=$(date "+%Y%m%d_%H%M")

# save current state of schedule
oldfile=$kondir/data/$jsonfile
newfile=$kondir/data/archive/$timestamp.$jsonfile
mkdir -p $(dirname $newfile)
rsync -a $oldfile $newfile

# update the appcache
timestamp=$(TZ='America/New_York' date)
sed -i "s/^# .*/# $timestamp/" $kondir/$manifest 2>/dev/null
