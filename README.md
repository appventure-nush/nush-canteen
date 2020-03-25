# NUSH Canteen

A suite of tools related to NUS High School's canteen.

Currently, it runs on a server and allows you to check:
- Canteen queue length - average no. of people around and wait time
- [WIP] Stall availability - whether each stall is opened or closed

## Web Server setup & usage

- Install all dependencies with `npm install`.
- Start the web server with `npm start` or `node server.js`.

## Queue Analyser setup & usage

NOTE: this setup should only be done on a device used for perpetually tracking live queue data. The `queueAnalyser` directory can be left alone otherwise, but it's existence is still depended upon by the web server for calculating queue length.

- Install `wireshark`.
- Install all requirements listed in `requirements.txt` in `queueAnalyser` via `pip3`.
- Connect `wlan1` interface in monitor mode.
- Run `startMonitoring` script in `queueAnalyser` folder..
