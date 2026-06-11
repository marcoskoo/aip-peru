#!/bin/bash
while true; do
  bun --bun run dev
  echo "Server crashed, restarting in 3 seconds..."
  sleep 3
done
