#!/bin/sh
set -eu

# Pastikan direktori upload tersedia. Named volume yang sudah ada akan
# mewarisi kepemilikan dari image saat pertama kali dibuat.
UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
mkdir -p "$UPLOAD_DIR"

exec "$@"
