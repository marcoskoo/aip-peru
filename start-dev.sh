#!/bin/bash
cd /home/z/my-project
export PATH="/home/z/my-project/node_modules/.bin:$PATH"
exec next dev -p 3000 > /home/z/my-project/dev.log 2>&1
