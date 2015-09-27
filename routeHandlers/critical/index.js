'use strict';
// todo: make this work for https?  doesn't seem to work for my.oc.netflix.com
//

var criticalcss = require("criticalcss");
var fs = require('fs');
var getHtmlAndCss = require('./getHtmlAndCss.js');
var path = require('path');
var Promise = require('bluebird');
var rp = require('request-promise');
var tmpDir = require('os').tmpDir();
var NodeCache = require( "node-cache" );

var cache = new NodeCache( { stdTTL: 600, checkperiod: 600 } );

var handleFailure = function (res, err) {
    // todo: log stack trace?
    res.status(500).send(JSON.stringify({"status": "failure"}));
};

var parseForUrl = function (req) {
    // Parse input for URL
    // 17 = /api/criticalcss/*
    // remove the front 2 chunks to get to the *
    return req.path.substr(17);
};

var respondWithCss = function (res, css) {
    res.type('text/css');
    res.status(200).send(css);

};

var get = function (req, res) {
    console.log('starting it up');

    var url = parseForUrl(req),

        cssPath = '',
        cssStr = '',
        htmlPath = '',
        htmlAndCssPromise,
        htmlAndCssReturn,
        cssPromises = [];


    console.log('url to fetch is', url);

    var cachedCss = cache.get(url);
    if(cachedCss){
        return respondWithCss(res, cachedCss);
    }

    cssPath = path.join(tmpDir, 'style.css');
    htmlPath = path.join(tmpDir, 'content.html');


    htmlAndCssPromise = getHtmlAndCss(url);

    console.log('htmlAndCssPromise attempted');

    htmlAndCssPromise
        .then(function (result) {
            console.log('getHtmlAndCss: success:', result.stdout.toString());
            htmlAndCssReturn = JSON.parse(result.stdout.toString());

            if ('success' !== htmlAndCssReturn.status) {
                return handleFailure(res, 'Failed to fetch url:', url);
            }

            if (!htmlAndCssReturn.css.length) {
                // Short cut it, nothing to optimize
                console.log('No CSS to fetch');
                return respondWithCss(res, '/* No External CSS Found */');
            }

            for (var i = 0; i < htmlAndCssReturn.css.length; i++) {
                cssPromises.push(rp(htmlAndCssReturn.css[i]));
                console.log('CSS to fetch: ', htmlAndCssReturn.css[i])
            }

            // todo:  stop mixing promises and callbacks.  wrap critical in a promise
            Promise.settle(cssPromises).then(function (results) {
                results.forEach(function (result) {
                    if (result.isFulfilled()) {
                        cssStr += result.value();
                    }
                });

                // TODO: unsynch this stuff.  Promisify it.
                fs.writeFileSync(cssPath, cssStr);
                fs.writeFileSync(htmlPath, htmlAndCssReturn.html);

                criticalcss.getRules(cssPath, function (err, rules) {
                    if (err) {
                        console.log('criticalcss.getRules: failed', err);
                        handleFailure(res, err);
                    } else {
                        console.log('criticalcss.getRules: success');

                        criticalcss.findCritical(htmlPath, {rules: JSON.parse(rules)}, function (err, criticalCssRules) {
                            if (err) {
                                console.log('criticalcss.findCitical: failed', err);
                                handleFailure(res, err);
                            } else {
                                console.log('criticalcss.findCritical: success');
                                console.log(criticalCssRules);
                                cache.set(url, criticalCssRules);
                                return respondWithCss(res, criticalCssRules);
                            }

                        });
                    }
                });

            }); // then for promise array

        }) // then
        .fail(function (err) {
            console.log('getHtmlAndCss: failed:', err, htmlAndCssPromise);
            handleFailure(res, err);
        });
};

exports.get = get;
