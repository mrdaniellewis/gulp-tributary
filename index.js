/* jshint node:true */
/* global Promise: false */
"use strict";

var through = require('through2');

if ( typeof Promise === 'undefined' ) {
    global.Promise = require('promise-polyfill');
}

var mime = require('mime-types');
var Tributary = require('tributary');
var collect = require('stream-collect');

var findFile = require('./lib/find-file.js');

var debug = require('debug')('gulp-tributary');

var PLUGIN_NAME = 'gulp-tributary';

// Default placeholders based on the mimetype of the document
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
 *  @param {String[]} [options.placeholder] The placeholder template to use
 *  @param {String} [options.mediaType] The media type used to choose the placeholder
 *  @returns {stream.Transform}
 */
function include( includes, options ) {
    
    options = options || {};
    var forceMediaType = options.mediaType;
    var ignoreMissingFiles = options.ignoreMissingFiles === true;
    var delimiter = options.delimiter;
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
                    if ( !ignoreMissingFiles ) {
                        var error = new Error( PLUGIN_NAME + ': ' + filename + ' not found' );
                        stream.emit( 'error', error );
                    }
                    cb();
                    return;
                }
                cb( file.pipe(through()) );
            } );
        
    }

    function getInjector( mediaType ) {
        var placeholder = options.placeholder || placeholders[mediaType] || placeholders['text/plain'];
        var injector = new Tributary( {
            placeholderStart: placeholder[0],
            placeholderEnd: placeholder[1],
            getStream: getStream,
            delimiter: delimiter
        } );
        return injector;
    }

    var stream = through.obj( function(file, enc, cb) {

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

    return stream;

}

module.exports = include;
include.placeholders = placeholders;
