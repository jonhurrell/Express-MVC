// Gulp ----------------------------------
// Gulp is a build system/task automator written for nodejs. It’s useful
// for simplifying and speeding up your build process, automating tasks
// such as compiling code, minification, and concatenation.
// ---------------------------------------





// Gulp utility

var gulp               = require('gulp'),
	gutil              = require('gulp-util'),
	gulpif             = require('gulp-if');

// Requires.

var nodemon            = require('gulp-nodemon'),
	plumber            = require('gulp-plumber'),
	del                = require('del'),
	runsequence        = require('run-sequence'),
	importOnce         = require('node-sass-import-once');

// Plugin requires.

var concat             = require('gulp-concat'),
	eslint             = require('gulp-eslint'),
	uglify             = require('gulp-uglify'),
	rename             = require('gulp-rename'),
	sass               = require('gulp-sass'),
	autoprefixer       = require('gulp-autoprefixer'),
	nano               = require('gulp-cssnano'),
	sourcemaps         = require('gulp-sourcemaps'),
	livereload         = require('gulp-livereload'),
	sasslint           = require('gulp-sass-lint'),
	imagemin           = require('gulp-imagemin'),
	newer              = require('gulp-newer'),
	notify             = require('gulp-notify');

// Load external config.

var config             = require('./gulp-config.json'),
	publicDirectory    = config.publicDirectory;





// Error Handling and Notification -------
// Make error handling easier by outputting the error message
// to the console and sending a notification.
// ---------------------------------------
// 1. Setup the error notification.
// 2. Log error to console.
// 3. Let gulp know to end the task that errors and not to break
//    the run (forcing you to restart gulp).

function errorAlert(err) {

	notify.onError({
		title: 'Error', message: '<%= error.message %>', sound: 'Sosumi'
	})(err);
	console.log(err.toString());
	this.emit('end');

}





// Script build task ---------------------
// Combines and uglifies JS, producing both a minified and non-minified
// version in public/js.
// ---------------------------------------
// 1. Assign our output directory to a variable.
// 2. Use all files defined by files.scripts within config.
// 3. Pipe the readable stream through gulp-plumber, which prevents pipe
//    breaking caused by errors from gulp plugins (replaces pipe method
//    and removes standard onerror handler on errors event, which unpipes
//    streams on error by default). Pass in our errorAlert function
//    to the onerror handler.
// 4. Run JSHint and report the output.
// 5. Combine into main.js
// 6. Output combined but non-minified version to public/js.
// 7. Rename to main.min.js
// 8. Uglify to minify.
// 9. Output minified version to public/js.

gulp.task('scripts', function() {

	var outputDirectory = publicDirectory + 'js/';                 // [1]

	return gulp.src(config.files.scripts)                          // [2]
		.pipe(plumber({errorHandler: errorAlert}))                 // [3]
		.pipe(eslint())                                            // [4]
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
		.pipe(concat('main.js'))                                   // [5]
		.pipe(gulp.dest(outputDirectory))                          // [6]
		.pipe(rename({ suffix: '.min' }))                          // [7]
		.pipe(uglify())                                            // [8}
		.pipe(gulp.dest(outputDirectory));                         // [9]

});





// Styles build task ---------------------
// Compiles CSS from Sass, auto-prefixes and optionally outputs a source map,
// which allows you to edit your Sass directly within DevTools.
// Output both a minified and non-minified version into /public/css.
// ---------------------------------------
// 1. Assign our output directory to a variable.
// 2. Using all files defined by files.styles within config.
// 3. Pipe the readable stream through gulp-plumber, which prevents pipe
//    breaking caused by errors from gulp plugins (replaces pipe method
//    and removes standard onerror handler on errors event, which unpipes
//    streams on error by default). Pass in our errorAlert function
//    to the onerror handler.
// 4. Conditionally initialise sourcemaps (if sourceMaps == true within config).
// 5. Pipe stream through sasslint.
// 5. Compile using Sass, expanded style.
// 6. Include and compile any Sass partials defined by files.nodeModules
//    within config.
// 7. Prevent styles from being duplicated if a Sass partial declares it's
//    own dependencies (encapsulation) using the @import directive.
// 8. Auto-prefix (e.g. -moz-) using last 2 browser versions.
// 9. Conditionally pipe stream through sourcemaps (if sourceMaps == true within config)
//    and write out a source map to the directory defined by files.styleMap
//    within config.
// 10.Output prefixed but non-minifed CSS to public/css
// 11.Rename to .min.css
// 12.Minify the CSS.
// 13.Conditionally write sourcemaps (if sourceMaps == true within config)
//    to the directory defined by files.styleMap within config.
//    Bug in DevTools that prevents it from using the source map:
//    https://github.com/terinjokes/gulp-uglify/issues/105#issuecomment-160292080
// 14.Output prefixed, minified CSS to public/css.

gulp.task('styles', function() {

	var outputDirectory = publicDirectory + 'css/';                // [1]

	return gulp.src(config.files.styles)                           // [2]
		.pipe(plumber({errorHandler: errorAlert}))                 // [3]
		.pipe(gulpif(config.sourceMaps, sourcemaps.init()))        // [4]
		.pipe(sasslint({                                           // [5]
			'config': '.sass-lint.yml'
		}))
		.pipe(sasslint.format())
		.pipe(sasslint.failOnError())
		.pipe(sass({                                               // [6]
			style: 'expanded',
			includePaths: [config.files.nodeModules],              // [7]
			importer: importOnce                                   // [8]
		}))
		.pipe(autoprefixer('last 2 versions'))                     // [9]
		.pipe(gulp.dest(outputDirectory))                          // [10]
		.pipe(rename({ suffix: '.min' }))                          // [11]
		.pipe(nano())                                              // [12]
		.pipe(gulpif(
			config.sourceMaps, sourcemaps.write(
			config.files.stylesMap
		)))                                                        // [13]
		.pipe(gulp.dest(outputDirectory));                         // [14]

});





// Image optimisation task ---------------
// Minify PNG, JPEG, GIF and SVG images.
// Outputs a minified version into /public/images.
// ---------------------------------------
// 1. Assign our output directory to a variable.
// 2. Use files defined in files.images config.
// 3. Pipe the readable stream through gulp-plumber, which prevents pipe
//    breaking caused by errors from gulp plugins (replaces pipe method
//    and removes standard onerror handler on errors event, which unpipes
//    streams on error by default). Pass in our errorAlert function
//    to the onerror handler.
// 4. Conditionally pipe stream through imagemin (if minifyImages == true
//    within config).
// 5. Filter to only images that are newer than within public/images.
// 6. Output optimised images to public/images.

gulp.task('images', function() {

	var outputDirectory = publicDirectory + 'images/';             // [1]

	return gulp.src(config.files.images)                           // [2]
		.pipe(plumber({errorHandler: errorAlert}))                 // [3]
		.pipe(gulpif(config.minifyImages, imagemin({               // [4]
			optimizationLevel: 3,
			progressive: true,
			interlaced: true
		})))
		.pipe(newer(outputDirectory))                              // [5]
		.pipe(gulp.dest(outputDirectory));                         // [6]

});





// Watch task ----------------------------
// Sets up several watchers. Using different config for styles and
// templates as they have partials that need watching but not compiling.
// ---------------------------------------
// 1. Any changes to any files defined by files.watchStyles within config
//    starts styles task.
// 2. Any changes to any files defined by files.scripts within config
//    starts scripts task.
// 3. Any changes to any files defined by files.images within config
//    starts images task.

gulp.task('watch', function() {

	gulp.watch(config.files.watchStyles, ['styles']);              // [1]
	gulp.watch(config.files.scripts, ['scripts']);                 // [2]
	gulp.watch(config.files.images, ['images']);                   // [3]

});





// Clean task ----------------------------
// Deletes the /public directory
// ---------------------------------------

gulp.task('clean', function(callback) {
	return del(publicDirectory);
});





// Copy task ----------------------------
// Copies over any files that are not part of other tasks
// (e.g. HTML templates, JS libraries) to the public directory
// ---------------------------------------
// 1. Change the base path to avoid copying top-level directory.

gulp.task('copy', function() {
	return gulp.src(config.files.copy, { base: config.copyBase })  // [1]
		.pipe(gulp.dest(publicDirectory));
});





// Develop task --------------------------
// Runs build task and sets up watches.
// ---------------------------------------
// 1. Control the shutdown of the nodemon process within gulp. Let's capture
//    the kill signal and handle it (otherwise we have to crtl + c twice).
// 2. Assign our output directory to variable.
// 3. Start a LiveReload server.
// 4. Watch for any changes in public/ and conditionally check to see if we
//    want LiveReload to automatically refresh the browser from our config.
// 4. Any changes to template files will automatically restart the node app.

gulp.task('develop', ['build', 'watch'], function () {

	function exitHandler() {                                       // [1]
		process.kill(process.pid, 'SIGINT');
	}

	process.once('SIGINT', exitHandler);

	var outputDirectory = publicDirectory + '**/*';                // [2]

	livereload.listen();                                           // [3]

	gulp.watch(outputDirectory
		).on(gulpif(config.autoReload, 'change'), livereload.changed
	);                                                             // [4]

	// Setup nodemon -------------------------
	// nodemon will watch the files in the directory in which nodemon was
	// started, and if any files change, nodemon will automatically restart
	// your node application.
	// ---------------------------------------
	// 1. Pass in the the app script to start/restart during the task.
	// 2. Watch for any changes to nunjucks files in the directory.
	// 3. Tell nodemon not to output to console.
	// 4. Invoking a livereload server at the start of gulp develop task,
	//    (before we start the nodemon child process—which starts the app.js
	//    through the app.listen method), means we'll need to run a function
	//    to monitor the stdout stream of the nodemon child process, so we can
	//    test for an output, and then tell LiveReload there's been a change
	//    to reload.
	//    If we don't the gulp task will refresh the LiveReload server
	//    before the nodemon child process has invoked the app.listen method
	//    from the parent process, causing the browser to refresh without the
	//    server being ready.
	//    The `readable` event indicates that data is ready to pick up in the
	//    stdout and stderr streams.
	//    Conditionally check to see if we want LiveReload to automatically
	//    refresh the browser from our config. If true…
	// 5. …let's listen for a data event to the stdout stream from the
	//    parent process…
	// 6. …and use the test method to search for a match of the specified
	//    string and if this returns true…
	// 7. …tell live reload there's been a change.
	// 8. Pipe the nodemon child process stdout/stderr to the parent process
	//    stdout/stderr streams.

	nodemon({
		script: 'app.js',                                          // [1]
		ext: 'nunjucks',                                           // [2]
		stdout: false                                              // [3]
	}).on(gulpif(config.autoReload, 'readable'), function () {     // [4]

		this.stdout.on('data', function (chunk) {                  // [5]

			if(/^Express server listening on/.test(chunk)){        // [6]

				livereload.changed(__dirname);                     // [7]
			}

		});

		this.stdout.pipe(process.stdout);                          // [8]
		this.stderr.pipe(process.stderr);

	});

});





// Build task ----------------------------
// Runs other tasks that produce a built project in the public directory.
// ---------------------------------------

gulp.task('build', function(callback) {
	runsequence('clean', ['scripts', 'styles', 'images', 'copy'], callback);
});





// Default task --------------------------
// Lists out available tasks.
// ---------------------------------------

gulp.task('default', function() {

	var cyan = gutil.colors.cyan,
		green = gutil.colors.green;

	gutil.log(green('----------'));

	gutil.log(('The following main ') + cyan('tasks') + (' are available:'));

	gutil.log(cyan('build'
		) + ': builds the contents to the public directory.'
	);
	gutil.log(cyan('develop'
		) + ': performs an initial build then sets up watches.'
	);

	gutil.log(green('----------'));

});
