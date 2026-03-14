#!/bin/bash
set -e

BIND="${BIND:-127.0.0.1:8090}"
BINARY="./linx-minx"

# Clean previous run
rm -rf files/ test-results/

# Start server
$BINARY -bind "$BIND" &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT

# Wait for server to be ready
for i in $(seq 1 10); do
    if curl -s -o /dev/null "http://$BIND/"; then
        break
    fi
    sleep 1
done

# Run tests
./node_modules/.bin/playwright test "$@"
