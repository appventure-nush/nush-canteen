# NUSH Canteen

Find out the canteen queue length - estimated number of people in the longest queue and wait time necessary to purchase food.

## Web Server setup & usage

- Install all dependencies with `npm install`.
- Start the web server with `npm start` or `node server.js`.

## Queue Analyser setup & usage

NOTE: this setup should only be done on a device used for perpetually tracking live queue data. The `queueAnalyser` directory can be left alone otherwise, but it's existence is still depended upon by the web server for calculating queue length.

- Install `wireshark` and `tshark`.
- Install all requirements listed in `requirements.txt` in `queueAnalyser` via `pip3`.
- Connect `wlan1` interface in monitor mode.
- Run `startMonitoring` script in `queueAnalyser` folder.
