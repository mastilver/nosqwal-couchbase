#!/bin/bash
set -ev

while :
do
    sleep 1;
    echo 'couchbase server is starting';
    curl http://127.0.0.1:8091 &>/dev/null || continue;

    break;
done

echo 'couchbase server is running'
