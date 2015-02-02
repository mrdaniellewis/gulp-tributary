/* jshint node:true, mocha: true */
"use strict";

var fs = require('fs');
var path = require('path');

var tributary = require('../');
var File = require('vinyl');
var through = require('through2');
var collect = require('stream-collect');
var expect = require('expect');

describe( 'gulp-tributary', function() {

	describe( 'null file', function() {

		it( 'should return a null file', function() {

			var file = new File();
			var includer = tributary();
			includer.end(file);

			return collect(includer)
				.then( function(data) {
					var file = data[0];
					expect( file.isNull() ).toBe( true );
				} );

		});
		
	});

	describe( 'in buffer mode', function() {

		it( 'should return the original file', function() {

			var file = new File( {
				contents: new Buffer('abufferwiththiscontent')
			} );

			var includer = tributary();
			includer.end(file);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isBuffer() ).toBe(true);
					expect( file.contents.toString('utf8') ).toBe( 'abufferwiththiscontent' );
				} );
		});

		it( 'should insert a file', function() {

			var file = new File( {
				contents: new Buffer('some content <!-- include "include.txt" --> some more content')
			} );

			var includeFile = new File( {
				path: '/include.txt',
				base: '/',
				contents: new Buffer('replaced content')
			} );

			var includeStream = through( {objectMode:true} );
			includeStream.end(includeFile);

			var includer = tributary( includeStream );
			includer.end(file);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isBuffer() ).toBe(true);
					expect( file.contents.toString('utf8') )
						.toBe( 'some content replaced content some more content' );
				} );

		});
		
	});

	describe( 'in stream mode', function() {

		it( 'should return the original file', function() {

			var stream = through();
			stream.end('astreamwithcontents');
			var fakeFile = new File( {
				contents: stream
			} );

			var includer = tributary();
			includer.end(fakeFile);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isStream() ).toBe( true );

					return collect(file.contents);
				} )
				.then( function(data) {
					expect( data.toString('utf8') ).toBe( 'astreamwithcontents' );
				} );

		});

		it( 'should insert a file', function() {

			var stream = through();
			stream.end('some content <!-- include "include.txt" --> some more content');
			var fakeFile = new File( {
				contents: stream
			} );

			var includeFile = new File( {
				path: '/include.txt',
				base: '/',
				contents: new Buffer('replaced content')
			} );

			var includeStream = through( {objectMode:true});
			includeStream.end(includeFile);

			var includer = tributary(includeStream);
			includer.end(fakeFile);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isStream() ).toBe( true );

					return collect(file.contents);
				} )
				.then( function(data) {
					expect( data.toString('utf8') ).toBe( 'some content replaced content some more content' );
				} );

		} );

	} );

	describe( 'media types', function() {

		
		function runTest( extension, start, end, done ) {

			var file = new File( {
				contents: new Buffer( 
					'some content ' + start + '"include.txt"' + end + ' some more content'
				),
				path: 'include.' + extension 
			} );

			var includeFile = new File( {
				path: '/include.txt',
				base: '/',
				contents: new Buffer('replaced content')
			} );

			var includeStream = through( {objectMode:true} );
			includeStream.end(includeFile);

			var includer = tributary( includeStream );
			includer.end(file);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isBuffer() ).toBe(true);
					expect( file.contents.toString('utf8') )
						.toBe( 'some content replaced content some more content' );
				} )
				.then( done );

		}

		[	['html', 'htm', '<!-- include ', ' -->'],
			['JavaScript', 'js', '/* include ', ' */'],
			['CSS', 'css', '/* include ', ' */'],
			['LESS', 'less', '/* include ', ' */'],
			['SASS', 'sass', '/* include ', ' */'],

		].forEach( function(item) {

			it( 
				'uses the correct escaping in ' + item[0] + ' files', 
				runTest.bind( null, item[1], item[2], item[3] )
			);

		} );

		it( 'accepts a custom placeholder', function() {

			var file = new File( {
				contents: new Buffer( 
					'some content ### "include.txt" ### some more content'
				)
			} );

			var includeFile = new File( {
				path: '/include.txt',
				base: '/',
				contents: new Buffer('replaced content')
			} );

			var includeStream = through( {objectMode:true} );
			includeStream.end(includeFile);

			var includer = tributary( includeStream, { placeholder: ['### ',' ###'] } );
			includer.end(file);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isBuffer() ).toBe(true);
					expect( file.contents.toString('utf8') )
						.toBe( 'some content replaced content some more content' );
				} );

		} );

		it( 'accepts a custom media type', function() {

			var file = new File( {
				contents: new Buffer( 
					'some content /* include "include.txt" */ some more content'
				),
				path: 'file.htm'
			} );

			var includeFile = new File( {
				path: '/include.txt',
				base: '/',
				contents: new Buffer('replaced content')
			} );

			var includeStream = through( {objectMode:true} );
			includeStream.end(includeFile);

			var includer = tributary( includeStream, { mediaType: 'application/javascript' } );
			includer.end(file);

			return collect(includer)
				.then( function(data) {
					var file = data[0];

					expect( file.isBuffer() ).toBe(true);
					expect( file.contents.toString('utf8') )
						.toBe( 'some content replaced content some more content' );
				} );

		} );

	} );

	describe( 'when a file is missing', function() {

		it( 'generates an error', function(done) {

			var file = new File( {
				contents: new Buffer( 
					'some content <!-- include "include.txt" --> some more content'
				),
				path: 'file.htm'
			} );

			var includeFile = new File( {
				path: '/youcannotfindme.txt',
				base: '/'
			} );

			var includeStream = through( {objectMode:true} );
			includeStream.end(includeFile);

			var includer = tributary( includeStream )
				.on( 'error', function(e) {
					expect( e ).toBeA( Error );
					expect( e.message ).toBe( 'gulp-tributary: include.txt not found' );
					done();
				} );

			includer.end(file);

		} );

		describe( 'if ignoreMissingFiles is true', function() {

			it( 'does not generate an error', function() {

				var file = new File( {
					contents: new Buffer( 
						'some content <!-- include "include.txt" --> some more content'
					),
					path: 'file.htm'
				} );

				var includeFile = new File( {
					path: '/youcannotfindme.txt',
					base: '/'
				} );

				var includeStream = through( {objectMode:true} );
				includeStream.end(includeFile);

				var includer = tributary( includeStream, { ignoreMissingFiles: true } );
				includer.end(file);

				return collect(includer)
					.then( function(data) {
						var file = data[0];

						expect( file.isBuffer() ).toBe(true);
						expect( file.contents.toString('utf8') )
							.toBe( 'some content  some more content' );
					} );
				} );

		} );

	} );

} );