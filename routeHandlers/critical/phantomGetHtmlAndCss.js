/*global document, phantom*/

'use strict';
/**
 * This calls phatomjs on a url, parses for css, then returns the html,
 * and an array of css links
 */

//TODO: figure out how to console log and still return prop json properly.  Need to redirct to something other than stdout
//TODO: Why doesn't phantom handle https://my.oc.netflix.com properly?

var system = require('system');
var page = require('webpage').create();
var pageUrl = system.args[1];

// TODO: add in media=screen?
var isCssLink = function (node) {
    return (node && node.href && node.href.match(/css$/i));
};

/*
 page.onNavigationRequested = function(url, type, willNavigate, main) {
 console.log('redir')
 if (main && url!=myurl) {
 myurl = url;
 console.log("redirect caught")
 page.close()
 setTimeout('renderPage(myurl)',1); //Note the setTimeout here
 }
 };
 */

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
        if (isCssLink(linkElements[i])){
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
