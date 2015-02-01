/**
 * Yet another gulp plugin for including files
 *
 * Finds placeholders in a file and replaces them with another file
 *
 *  The difference between this and other similar plugins is it takes a
 */

// @todo error handling
// @todo separate out file insertion
// @todo cleaner way of matching placeholder
// @todo remove used up streams


/* jshint node:true */
"use strict";

var through = require('through2');
var gutil = require('gulp-util');
var promiseUtil = require('promise-util');
var Promise = require('promise-polyfill');
var stream = require('stream');
var util = require('util');
var mime = require('mime-types');
var Tributary = require('tributary');
var collect = require('stream-collect');

var findFile = require('./lib/find-file.js');

var debug = require('debug')('gulp-tributary');

var PLUGIN_NAME = 'gulp-include';

var placeholders = {
    'text/plain': ['<!-- include ',' -->'],
    'text/html': ['<!-- include ',' -->'],
    'application/xml': ['<!-- include ',' -->'],
    'text/css': ['/* include ',' */'],
    'application/javascript': ['/* include ',' */']
};

['less','x-less','sass','x-sass','scss','x-scss'].forEach( function(synoymn) {
    placeholders[ 'text/' + synoymn ] = placeholders['text/css'];
} );

/**
 *  
 *  @param {stream.Readable} includes Object stream of vinyl files to include
 *  @param {String} [options.placeholder] The placeholder template to use
 *  @param {String} [options.mediaType] The media type used to choose the placeholder
 *  @returns {stream.Transform}
 */
function include( includes, options ) {
    
    options = options || {};
    var forceMediaType = options.mediaType;
    var errorOnNotFound = options.errorOnNotFound !== false;
    var files;
    if (includes ) {
        files = collect(includes);
    } else {
        files = Promise.resolve(null);
    }
   
    function getStream( filename, cb ) {

        files
            .then( function(files) {
                
                if ( !files ) {
                    cb();
                    return;
                }

                var file = findFile( filename, files );

                debug( 'found file', file );
                if ( file === null ) {
                    if ( errorOnNotFound ) {
                        var error = new Error( filename + ' not found' );
                        error.code = 'ENOENT';
                        cb(error);
                        return;
                    }
                    cb();
                }
                cb( file.pipe(through()) );
            } );
        
    }

    function getInjector( mediaType ) {
        var placeholder = options.placeholder || placeholders[mediaType] || placeholders['text/plain'];
        var injector = new Tributary( {
            placeholderStart: placeholder[0],
            placeholderEnd: placeholder[1],
            getStream: getStream
        } );
        return injector;
    }

    return through.obj( function(file, enc, cb) {

        if ( file.isNull() ) {
            cb(null, file);
            return;
        }

        var mediaType = forceMediaType || mime.lookup(file.path);

        if ( file.isBuffer() ) {
            // Process the buffer as a stream
            // and then write back as a buffer
            var buffer = new Buffer(0);

            var stream = through();
            stream.end(file.contents);
            stream.pipe( getInjector(mediaType) )
                .on( 'data', function(chunk) {
                    if ( chunk !== null ) {
                        buffer = Buffer.concat( [ buffer, chunk ] );
                    }
                } )
                .on( 'end', function() {
                    file.contents = buffer;
                    cb(null, file);
                } );

            return;
        }

        if ( file.isStream() ) {
            // Replace the stream with our piped stream
            file.contents = file.contents.pipe( getInjector(mediaType) );
        }

        cb(null, file);

    } );

}

module.exports = include;
include.placeholders = placeholders;
