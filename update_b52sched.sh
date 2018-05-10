#!/bin/bash

# setups
kondir=`dirname "${BASH_SOURCE[0]}"`
jsonfile=balticon52.json
zambiaurl="https://program.balticon.org/konOpas.php"
manifest=konopas.appcache
timestamp=`date "+%Y%m%d_%H%M"`

# save current state of schedule
oldfile=$kondir/data/$jsonfile
newfile=$kondir/data/$timestamp.$jsonfile
mkdir -p `dirname $newfile`
curl $zambiaurl >| $newfile 2>/dev/null

# if the schedule has changed,
if ! cmp -s $newfile $oldfile; then

    # make new schedule active and save a copy
    rsync -a $newfile $oldfile
    gzip $newfile

    # update the appcache
    timestamp=`TZ='America/New_York' date -r $oldfile`
    sed -i "s/^# .*/# $timestamp/" $kondir/$manifest 2>/dev/null

else    # otherwise, delete
    rm $newfile
fi
