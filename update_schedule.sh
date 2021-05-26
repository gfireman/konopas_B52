#!/bin/bash

# setups
kondir=$(dirname "${BASH_SOURCE[0]}")
jsonfile=$kondir/data/balticon55.json
manifest=$kondir/konopas.appcache

# update the appcache
timestamp=$(TZ='America/New_York' date -r $jsonfile)
sed -i "s/^# .*/# $timestamp/" $manifest 2>/dev/null
