# NUSH Canteen


## webserver setup

- Install node modules with `npm install`
- Start the web server with `sudo node server.js`

(You may autostart this with a cron job or on boot)

## webserver/queueAnalyser setup

NOTE: this should only be done on a device used for tracking queue data.

- Install `wireshark`
- Connect `wlan1` interface in monitor mode
- Run `startMonitoring` script

(You may autostart this with a cron job or on boot)

