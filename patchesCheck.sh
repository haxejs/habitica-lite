#!/bin/bash

echo 'starting to patch the FireLoop.js...'
diff patches/FireLoop.js.orig node_modules/@mean-expert/loopback-component-realtime/dist/modules/FireLoop.js
patch --force node_modules/@mean-expert/loopback-component-realtime/dist/modules/FireLoop.js -i patches/FireLoop.patch

echo 'starting to patch the job.js...'
diff patches/job.js.orig node_modules/agenda/lib/job.js
patch --force node_modules/agenda/lib/job.js -i patches/job.patch

echo 'starting to patch the agendash index page...'
diff patches/agendash_index.html.orig node_modules/agendash/public/index.html
patch --force node_modules/agendash/public/index.html -i patches/agendash_index.patch
