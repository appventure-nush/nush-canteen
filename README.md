# NUSH Canteen


## Web Server setup

- Install node modules with `npm install`
- Start the web server with `sudo node server.js`

## Queue Analyser setup

NOTE: this should only be done on a device used for perpetually tracking live queue data.

- Install `wireshark`
- Connect `wlan1` interface in monitor mode
- Run `startMonitoring` script in `queueAnalyser` folder.



(You may autostart these with a cron job or on boot)

