/**
 * This is just a wrapper around `phantomjs phantomGetHtmlAndCss.js URL`
 */

'use strict';

var path = require('path');
var spawn = require('child-process-promise').spawn;

function getScriptPath() {

    var currentFile = __filename;
    var parts = currentFile.split(path.sep);

    parts.pop();
    parts.push('phantomGetHtmlAndCss.js');

    var f = path.join.apply(null, parts);
    if (f.charAt(0) !== path.sep) {
        f = path.sep + f;
    }
    return f;
}

module.exports = function (pageUrl) {
    var scriptPath = getScriptPath();
    console.log('getHtmlAndCss: calling phantomjs', scriptPath, pageUrl);
    return spawn('phantomjs', ['--ignore-ssl-errors=yes', '--ssl-protocol=any', scriptPath, pageUrl], {capture: ['stdout', 'stderr']});
};
