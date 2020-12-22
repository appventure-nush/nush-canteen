const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const url = require("url");
const crypto = require("crypto");
const { exec } = require("child_process");
const port = 8080;

//Helper methods
function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

function cleanup() {
    exec("./queueAnalyser/cleanLogsAndUpdateJson", (error, stdout, stderr) => {
        if (error) {
            console.log(`cleanup error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`cleanup stderr: ${stderr}`);
            return;
        }
        console.log(`cleanup stdout: ${stdout}`);
    });
}
cleanup();
setInterval(cleanup, 86400);

//Secret key
// - for receiving queue data from tracker
var queueDataSecretKey = "<SECRET KEY PLACEHOLDER>";
if (process.env.SECRETKEY != null) {
    queueDataSecretKey = process.env.SECRETKEY;
} else {
    fs.readFile(__dirname + '/secretKey', function (err, data) {
        var readKey = data.toString('utf-8').trim();
        if (readKey == queueDataSecretKey) {
            console.log("Warning: secret key is not configured.");
            queueDataSecretKey = null; //Disallow use of default key
        } else {
            queueDataSecretKey = readKey;
        }
    });
}

var server = express();
server.use(bodyParser.json());

//Static content
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


// Public API
//  - Docs located at /public/api.html
server.get('/queueData', function (req,res) {
    fs.readFile(__dirname + '/queueAnalyser/data.log', function (err, data) {
        if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end("{}");
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
            res.end("[]");
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
            res.end("[]");
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


// Private API
server.post('/updateQueueData', function(req, res) {
    /*
     * Accepted POST data format:
     *
     * header:
     *  {
     *   ...,
     *   'signature': <signature signed using secretKey, and contents being (time + mode + data) string>,
     *   ...
     *  }
     *
     * body data:
     *  {
     *   "data_str" : <data>,
     *   "mode"     : <write mode>,
     *   "timestamp": <sec since 1970>
     *  }
     *
     */
    if (queueDataSecretKey !== null) {
        //Retrieve data
        var givenData = req.body.data_str;
        var givenWriteMethod = req.body.mode;
        var givenTimestamp = req.body.timestamp;
        var givenSignature = req.get('signature');

        if (givenData == null && givenWriteMethod == null && givenTimestamp == null && givenSignature == null) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({"status": "error", "reason": "data missing"}));
            return;
        }

        //Get signature and verify validity
        var digest_maker = crypto.createHmac('sha256', queueDataSecretKey);
        digest_maker.update(String(givenTimestamp) + givenWriteMethod + givenData);
        var derivedSignature = digest_maker.digest('hex');

        //Check if signatures match and if timestamp is within acceptable error of real time
        if (derivedSignature === givenSignature && Math.abs(givenTimestamp - Date.now()/1000) < 15) {

            //Verified source as signature is not tampered.
            var write = givenWriteMethod == "overwrite" ? fs.writeFile : fs.appendFile;
            write(__dirname + '/queueAnalyser/data.log', "\n" + givenData.trim(), function(err) {
                if (err) {
                    console.log(err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({"status": "error", "reason": err.toString()}));
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({"status": "success"}));
                }
            });
            return;
        }
    }

    //There is no way to verify, or source is invalid.
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({"status": "error", "reason": "access is forbidden"}));
});

server.listen(port, (err) => {
    if (err) {
        return console.log('Oops, something bad happened.', err);
    }

    console.log(`Server is now listening on ${port}`);
});
