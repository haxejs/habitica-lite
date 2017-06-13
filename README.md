# habitica lite 
A lightweight habit/task tracker app, inspired by HabitRPG(now habitica)

* Travis CI build: [![Build status](https://secure.travis-ci.org/haxejs/habitica-lite.svg)](http://travis-ci.org/haxejs/habitica-lite)  

## Why habitica lite?
The shortcomes of HabitRPG(habitica) are:
1. The habitica is somehow over gamification for some people.
2. The daily cron is triggered by first user visit of each day.
3. The technologies are a little outdated

So I decided to rewrite a lightweight version of it from scratch with latest technology stack:
1. Strongloop(based on node.js and express.js), a REST API framework with micro service infrastructure
2. Agenda,lightweight job scheduling to run daily cron and todo reminders
3. Mongodb, a schema-free NoSQL database
4. Socket.io, real-time bidirectional event-based communication
5. Angular 2, One front-end framework for Mobile & desktop.
6. Docker, transition to DevOps


## What parts will it consist of? (by priority)

### ongoing:
1. REST API Server (cluster) (by Strongloop) and Mongodb (cluster) [in server folder](server/)
2. Wechat mini app -- https://github.com/haxejs/habitica-lite-wechat-mini-app

### pending:
3. Native Mobile Apps(iOS & Android)(by NativeScript+Angular 2 or 4) -- https://github.com/haxejs/habitica-lite-mobile-apps
4. Web app (by Angular 2 or 4)  [in client folder](client/)

## How to set up local development environment?
1. install node.js(^v6.10.1),mongodb(^2.6.10), and mongodb is running at localhost:27017
2. `git clone https://github.com/haxejs/habitica-lite`
3. `cd habitica-lite` and run `npm install`
4. apply a patch by `./patchesCheck.sh`
5. start the server by `npm start`
6. In browser, open https://localhost:3000/explorer to play the REST API


