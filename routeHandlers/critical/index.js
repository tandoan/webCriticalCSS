'use strict';

var criticalcss = require("criticalcss");
var NodeCache = require("node-cache");
var fs = require('fs');
var getHtmlAndCss = require('./getHtmlAndCss.js');
var path = require('path');
var Promise = require('bluebird');
var rp = require('request-promise');

var writeFile = Promise.promisify(fs.writeFile);
var getRules = Promise.promisify(criticalcss.getRules);
var findCritical = Promise.promisify(criticalcss.findCritical);

var cache = new NodeCache({stdTTL: 600, checkperiod: 600});

var NO_EXTERNAL_CSS = '/* No External CSS Found */';

function handleFailure(res, err) {
    // todo: log stack trace?
    console.log('error', err);
    res.status(500).send(JSON.stringify({"status": "failure"}));
}

function parseForUrl(req) {
    // Parse input for URL
    // 17 = /api/criticalcss/*
    // remove the front 2 chunks to get to the *
    return req.path.substr(17);
}

function respondWithCss(res, css) {
    res.type('text/css');
    res.status(200).send(css);
    return css;
}

function getCachedCss(url) {
    return cache.get(url);
}

function cacheCss(url, css) {
    return cache.set(url, css);
}

function doGet(url, res) {
    var cachedCss = getCachedCss(url);
    if (cachedCss) {
        return Promise.resolve(respondWithCss(res, cachedCss));
    }

    console.time('findCritical');
    return fetchCriticalCss(url)
        .then(function (criticalCss) {
            cacheCss(url, criticalCss);
            return Promise.resolve(respondWithCss(res, criticalCss));
        },
        function (error) {
            return Promise.reject(handleFailure(res, error));
        })
        .finally(function () {
            console.timeEnd('findCritical');
        });
}

function saveHtmlAndCss(cssPromise, htmlAndCssReturn) {
    var cssStr = '',
        promises = [],
        tmpDir = require('os').tmpDir(),
        cssPath = path.join(tmpDir, 'style.css'),
        htmlPath = path.join(tmpDir, 'content.html');

    cssPromise.forEach(function (result) {
        if (result.isFulfilled()) {
            cssStr += result.value();
        }
    });

    promises.push(writeFile(cssPath, cssStr));
    promises.push(writeFile(htmlPath, htmlAndCssReturn.html));

    return Promise.all(promises)
        .then(function () {
            return Promise.resolve({
                "cssPath": cssPath,
                "htmlPath": htmlPath
            });
        });
}


/**
 *
 * @param result an object where  result.stdout =  status: success/fail, url: string, css: [urls], and html: string
 */
function processPhantomResult(result) {
    var cssPromises = [],
        phantomString = result.stdout.toString();

    var htmlAndCssReturn = JSON.parse(phantomString);

    console.log('getHtmlAndCss: success:', phantomString);

    if ('success' !== htmlAndCssReturn.status) {
        return Promise.reject('Failed to fetch url: ' + htmlAndCssReturn.url);
    }

    if (!htmlAndCssReturn.css.length) {
        console.log('No CSS to fetch');
        return Promise.resolve(NO_EXTERNAL_CSS);
    }

    // for instead of map, because order is important
    for (var i = 0; i < htmlAndCssReturn.css.length; i++) {
        cssPromises.push(rp(htmlAndCssReturn.css[i]));
        console.log('CSS to fetch: ', htmlAndCssReturn.css[i]);
    }

    return Promise.settle(cssPromises)
        .then(function saveHtmlAndCssWrapper(result) {
            return saveHtmlAndCss(result, htmlAndCssReturn);
        })
        .then(function criticalGetRulesWrapper(pathsObj) {
            return getRules(pathsObj.cssPath)
                .then(function criticalFindCriticalWrapper(rules) {
                    return findCritical(pathsObj.htmlPath, {rules: JSON.parse(rules)});
                });
        });

}

function fetchCriticalCss(url) {
    return getHtmlAndCss(url)
        .then(processPhantomResult,
        function (err) {
            console.log('getHtmlAndCss: failed:', err);
            return Promise.reject(err);
        });
}

function get(req, res) {
    console.log('Starting get');
    doGet(parseForUrl(req), res)
        .finally(function () {
            console.log('Ending get');
            res.end();
        });
}

exports.get = get;
