"use strict";
var express = require('express'),
    port = process.env.PORT,
    debug = require('debug')('worker'),
    http = require('http'),
    db = require('nano')(process.env.COUCH_DB),
    bodyParser = require('body-parser'),
    getNextStep = require('./next-step'),
    feed,
    app = express();

function couchDBChangeHandler(change) {
    var nextStep, worker;
    if (change.doc.type !== "background-worker") {
        return;
    }
    worker = change.doc;
    nextStep = getNextStep(worker);
    if (!nextStep) {
        // We are done if there are no more steps to execute
        debug(worker.name, 'done');
        return;
    }
    debug(worker.name, nextStep.name, nextStep.progress, '%');
    nextStep.executeStep(worker, function (err, updatedWorker) {
        // TODO: handle errors. 
        db.insert(updatedWorker, function (err) {
            if (err) {
                console.error(err);
                console.trace(err.stack);
            }
        });
    });
}

/* 
 * Feed set up.
 * nano uses [follow](https://github.com/iriscouch/follow)
 * to create the changes feed.
 */
feed = db.follow({
    since: 'now',
    include_docs: true
});
feed.on('change', couchDBChangeHandler);

feed.follow();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

/* 
 * PUT /worker router will add a new worker to our database
 */
app.put('/worker', function (req, res, next) {
    var worker = {
        type: 'background-worker',
        name: req.body.name || 'unnamed worker'
    };
    db.insert(worker, function (err, response, headers) {
        if (err) {
            console.error('Can not create worker', err);
            return next(err);
        }
        res.status(201);
        res.set('ETag', response.rev);
        res.location(headers.location);
        res.end();
    });
});
http.createServer(app).listen(port, function (err) {
    if (err) {
        console.error('Can not listent to ' + port + ';' + err);
    } else {
        console.log('background-worker example listening at ' + port);
    }
});
