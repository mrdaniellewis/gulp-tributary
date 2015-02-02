# Gulp tributary

Includes one file inside another by replacing placeholders with a file.  Just like the `#include` directive of server side includes.

There are several other Gulp plugins that also do this, the differece with this one are the included files are taken from a Gulp stream rather than directly from the file system.

There are also compatible with Vinyl streams.

## Example

Given the files:

```html
<head>
	<title>My awesome page</title>
	<script><!-- include "my.js" --></script>
</head>
```

```js
function myAwesomeFunction() {}
```

We can put them together to create:

```html
<head>
	<title>My awesome page</title>
	<script>function myAwesomeFunction() {}</script>
</head>
```

By using the following grunt task:

```js
var tributary = require('gulp-tributary');

gulp.src('awesome-page.htm')
    .pipe( tributary( gulp.src('script.js') ) )
    .pipe( gulp.dest('dest') );
```

However, if we also wanted to minifiy the javascript we could do the following:

```js
var jsSource = gulp.src('script.js')
	.pipe( require('gulp-uglify')() );

gulp.src('awesome-page.htm')
    .pipe( tributary( jsSource ) )
    .pipe( gulp.dest('dest') );
```

## `tributary( source, options )`

* `source` a stream of Vinyl files that might be included, e.g. `gulp.src()`
* `options.mediaType` specify the media type of the files.  Used to choose the placeholder tags
* `options.placeholder` an Array containing the start and end parts of the placeholder
* `options.ignoreMissingFiles` Boolean, default = false, if true don't error if an included file cannot be found.

## Placeholders

The default placeholders depend on the media type of the file and are determined from the extension.  The html placeholder is used as the default.

They must be matched exactly.  The filetype delimiter is fixed.

* text/html - .htm - `<!-- include "filename" -->`
* application/javascript - .js - `/* include "filename" */`
* text/css - .js, .less, .sass, .scss - `/* include "filename" */`

These defaults can be overriden using the placeholder option.  The media type of the file can be overriden using the mediaType option.

The default templates are set on a property of the `tributary` object called `placeholders` which can be used to modfiy them globally.
