/* jshint node:true */
/* global describe:false, it:false */

"use strict";

var include = require('../');
var assert = require('assert');
var File = require('vinyl');
var through = require('through2');

describe( 'gulp-include', function() {

	describe( 'null file', function() {

		it( 'should return a null file', function(done) {

			var fakeFile = new File();
			var includer = include();
			includer.write(fakeFile);

			// wait for the file to come back out
			includer.once('data', function(file) {
				// make sure it came out the same way it went in
				assert(file.isNull());
				done();
			});
		});
		
	});

	describe( 'in buffer mode', function() {

		it( 'should return the original file', function(done) {

			var fakeFile = new File( {
				contents: new Buffer('abufferwiththiscontent')
			} );

			var includer = include();
			includer.write(fakeFile);

			// wait for the file to come back out
			includer.once('data', function(file) {
				// make sure it came out the same way it went in
				assert(file.isBuffer());
				// check the contents
				assert.equal(file.contents.toString('utf8'), 'abufferwiththiscontent');
				done();
			});
		});

		it( 'should insert a file', function(done) {

			var fakeFile = new File( {
				contents: new Buffer('some content <!-- include "include.txt" --> some more content')
			} );

			var includeFile = new File( {
				path: '/include.txt',
				base: '/',
				contents: new Buffer('replaced content')
			} );

			var includeStream = through( {objectMode:true});

			var includer = include( includeStream );
			includeStream.end(includeFile);
			includer.end(fakeFile);

			// wait for the file to come back out
			includer.once('data', function(file) {
				// make sure it came out the same way it went in
				assert(file.isBuffer());
				// check the contents
				assert.equal(file.contents.toString('utf8'), 'some content replaced content some more content');
				done();
			});
		});
		
	});

	describe( 'in stream mode', function() {

		it( 'should return the original file', function(done) {

			var file = through();
			var fakeFile = new File( {
				contents: file
			} );

			var includer = include();
			includer.write(fakeFile);

			// wait for the file to come back out
			includer.once('data', function(output) {
				// make sure it came out the same way it went in
				assert(output.isStream());
				// check the contents
				//assert.equal(output.contents,file);
				done();
			});
		});

		it( 'should insert a file' );

	} );

	describe( 'media types', function() {

		// HTML
		// XML
		// JS
		// CSS
		// LESS
		// SASS
		// Custom

	} );

	// Check media types

	describe( 'a more practical example', function() {

		it( 'should add my string templates to my JS modele', function() {

			var output = fs.readFileSync( path.resolve( __dirname, 'example', 'output.js' ), { encoding: 'utf8' } );

			var source = gulp.src( './example/templates/*.*.' )
				.pipe( /* JS escape */ );
			
			gulp.src( './example/test.js' )
				.pipe( includer(source) )
				.once( 'data', function(vinyl) {

					collect( vinyl.pipe() )
						.then( function(data) {
							expect(data).toBe(output);
						} );
				} );
		} );

	} );

});