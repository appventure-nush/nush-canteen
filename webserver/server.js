const express = require('express');
const http = require('http');
const fs = require('fs');
const url = require("url");

const port = 80;

function isInt(value) {
	  return !isNaN(value) && 
		         parseInt(Number(value)) == value && 
		         !isNaN(parseInt(value, 10));
}

var server = express();

server.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

server.get('/moment.js', function(req, res) {
	res.sendFile(__dirname + '/public/moment.js');
});

server.get('/api', function(req, res) {
	res.sendFile(__dirname + '/public/api.html');
});

server.get('/background.jpg', function(req, res) {
	res.sendFile(__dirname + '/public/nushigh_header.jpg');
});

server.get('/down.png', function(req, res) {
	res.sendFile(__dirname + '/public/down.png');
});

server.get('/queueData', function (req,res) {
	fs.readFile(__dirname + '/queueAnalyser/data.log', function (err, data) {
		if (err) {
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json');
			res.end("Queue data could not be found.");
			return;
		}
		var lines = data.toString('utf-8').trim().split("\n");
		var json = lines[lines.length - 1];
		if (json.slice(-1) == ",") {json = json.substr(0, json.length-1);}
		
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.end(json);
	});
});

server.get('/recentQueueData', function(req,res) {
	fs.readFile(__dirname + '/queueAnalyser/data.log', function (err, data) {
		if (err) {
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json');
			res.end("Queue data could not be found.");
			return;
		}

		var lines = data.toString('utf-8').trim().split("\n");

		let query = url.parse(req.url, true).query;
		var amount = query.amount;
		var ordered = query.order == "latestToOldest";
		var requestedTimeAfter = query.since;

		if (amount === undefined || amount === null || !isInt(amount)) {
			amount = lines.length;
		}

		if (requestedTimeAfter === undefined || requestedTimeAfter === null || isNaN(requestedTimeAfter)) {
			requestedTimeAfter = 0;
		}

		var json = "";
		for (var i = lines.length - 1; i >= 0 && i >= (lines.length - amount); i--) {
			if (i < 0) { i = -1; continue; }
			if (lines[i].slice(-1) == ",") {lines[i] = lines[i].substr(0, lines[i].length - 1);}

			try {
				var obj = JSON.parse(lines[i]);
				var time = obj.time;
				if (time !== undefined) {
					if (time < requestedTimeAfter) {
						continue;
					}
				}
			} catch (err) {continue;}

			lines[i] += ",";

			//We're looping from last element to first, so if requests ordered (aka latest to oldest), just append normally
			if (ordered) {json += lines[i];} else {json = lines[i] + json;}
		}
		if (json.slice(-1) == ",") {json = json.substr(0, json.length-1);}
		json = "[" + json + "]";
		
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.end(json);
	});
});

server.get('/fullQueueData', function(req,res) {
	fs.readFile(__dirname + '/queueAnalyser/data.log', function (err, data) {
		if (err) {
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json');
			res.end("Queue data could not be found.");
			return;
		}

		var lines = data.toString('utf-8').trim().split("\n");

		let query = url.parse(req.url, true).query;
		var ordered = query.order == "latestToOldest";

		var json = "";
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].slice(-1) == ",") {lines[i] = lines[i].substr(0, lines[i].length - 1);}

			try {
			var obj = JSON.parse(lines[i]);
			} catch (err) {continue;}

			lines[i] += ",";
			//We're looping from first to last, so as long as requests not ordered (aka oldenst to latest), append normally
			if (!ordered) {json += lines[i];} else {json = lines[i] + json;}
		}
		if (json.slice(-1) == ",") {json = json.substr(0, json.length-1);}
		json = "[" + json + "]";
		
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.end(json);
	});
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});
