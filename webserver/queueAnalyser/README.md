# Queue Analyser tools

The tools here are tested and to be used on a raspberry pi with `wireshark` installed and with `wlan1` in monitor mode.

This will allow the current canteen queue data to be analysed and appended in `data.log`, formatted in a 'partial json format' - JSON objects containing queue information separated by line breaks. This format will be parsed by the webserver which then forwards the relevant valid JSON array of said JSON objects via its API to any requests made.

