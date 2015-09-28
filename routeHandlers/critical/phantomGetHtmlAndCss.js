/*global document, phantom*/

'use strict';
/**
 * This calls phatomjs on a url, parses for css, then returns the html,
 * and an array of css links
 */

var system = require('system');
var page = require('webpage').create();
var pageUrl = system.args[1];

// TODO: add in media=screen?
function isCssLink(node) {
    return (node && node.href && node.href.match(/css$/i));
}

/**
 *  Supress all output that isn't relevent to the json obj we want to return
 *  TODO: figure out how to log such output and still return json properly. Need to redir to something other than stdout
 */
page.onError = function(msg, trace) {
    // supress all error messages
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
    // supress all console messages
};

page.open(pageUrl, function (status) {
    if (status !== 'success') {
        console.log(JSON.stringify({"status": status, "url": pageUrl}));
        page.close();
        phantom.exit();
    }
});

page.onLoadFinished = function () {
    var cssArray = [];
    var linkElements = page.evaluate(function () {
        return document.querySelectorAll("link");
    });
    for (var i = 0; i < linkElements.length; i++) {
        if (isCssLink(linkElements[i])) {
            cssArray.push(linkElements[i]['href']);
        }
    }

    setTimeout(function () {
        // todo, strip \n\r  \t and stuff from page.content
        console.log(JSON.stringify({"status": 'success', "url": pageUrl, "css": cssArray, "html": page.content}));
        page.close();
        phantom.exit();
    }, 100);
};
