#!/bin/bash
cd /home/z/my-project
export PATH="/home/z/my-project/node_modules/.bin:$PATH"
export DATABASE_URL="postgresql://neondb_owner:npg_iwmyPLz6Ogb5@ep-orange-art-ackeipx3.sa-east-1.aws.neon.tech/neondb?sslmode=require"
(
  exec next dev -p 3000 > /home/z/my-project/dev.log 2>&1
) &
disown $! 2>/dev/null
exit 0
