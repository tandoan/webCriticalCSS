var express = require('express');
var app = express();

var criticalHandler = require('./routeHandlers/critical');

app.use(express.static('public'));

app.get('/api/criticalcss/*', criticalHandler.get);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('We\'re up at listening at http://%s:%s', host, port);
});
