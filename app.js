'use strict';

var express = require('express');
var app = express();
var criticalHandler = require('./routeHandlers/critical');

app.set('port', (process.env.PORT || 5000));


app.use(express.static(__dirname + '/public'));

app.get('/api/criticalcss/*', criticalHandler.get);

var server = app.listen(app.get('port'), function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('We\'re up at listening at http://%s:%s', host, port);
});
