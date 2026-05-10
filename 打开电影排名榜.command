#!/bin/zsh

cd "$(dirname "$0")" || exit 1

PORT=4173
URL="http://127.0.0.1:${PORT}/"

if ! curl -fs "$URL" >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/movie-ranking-server.log 2>&1 &
  sleep 1
fi

open -a "Microsoft Edge" "$URL" || open "$URL"
