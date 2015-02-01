/* jshint node:true */
"use strict";

var promiseUtil = require('promise-util');
var debug = require('debug')('gulp-tributary:findFile');

/**
 *  Find a file in an array of Vinyl file objects
 *  @param {String} filepath The file we are looking for
 *  @param {Vinyl[]} files An array of vinyl files
 *  @returns {Vinyl|null}
 */
function findFile( filepath, files ) {

    var file = null;

    debug( filepath );

    files.some( function(item) {
        
    	 debug( item.relative );

        if ( filepath === item.relative ) {
            file = item;
            return true;
        }
        return false;
    } );

    return file;

}

module.exports = findFile;