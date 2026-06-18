#!/bin/bash
# Double-fork pattern to fully detach from controlling shell
cd /home/z/my-project
export PATH="/home/z/my-project/node_modules/.bin:$PATH"
(
  # Second fork - this becomes the actual server process
  exec next dev -p 3000 > /home/z/my-project/dev.log 2>&1
) &
# Disown so it's not killed when this script exits
disown $! 2>/dev/null
exit 0
