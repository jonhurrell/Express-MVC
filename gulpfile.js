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
	stylish            = require('jshint-stylish');

// Plugin requires.

var concat             = require('gulp-concat'),
	uglify             = require('gulp-uglify'),
	jshint             = require('gulp-jshint'),
	rename             = require('gulp-rename'),
	sass               = require('gulp-sass'),
	autoprefixer       = require('gulp-autoprefixer'),
	minifycss          = require('gulp-minify-css'),
	livereload         = require('gulp-livereload'),
	scsslint           = require('gulp-scss-lint'),
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
// 3. Let gulp know to end the task that errored and not to break
//    the run (forcing you to restart gulp).

function errorAlert(err) {

	notify.onError({title: 'Error', message: '<%= error.message %>', sound: 'Sosumi'})(err);
	console.log(err.toString());
	this.emit('end');

};





// Script build task ---------------------
// Combines and uglifies JS, producing both a minified and non-minified
// version in public/js.
// ---------------------------------------
// 1. Assign our output directory to a variable.
// 2. Use all files defined in files.scripts config.
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
		.pipe((jshint()))                                          // [4]
		.pipe((jshint.reporter(stylish)))
		.pipe(concat('main.js'))                                   // [5]
		.pipe(gulp.dest(outputDirectory))                          // [6]
		.pipe(rename({ suffix : '.min' }))                         // [7]
		.pipe(uglify())                                            // [8}
		.pipe(gulp.dest(outputDirectory));                         // [9]

});





// Styles build task ---------------------
// Compiles CSS from SASS, auto-prefixes and outputs both a
// minified and non-minified version into /public/css.
// ---------------------------------------
// 1. Assign our output directory to a variable.
// 2. Using all files defined in files.styles config.
// 3. Pipe the readable stream through gulp-plumber, which prevents pipe
//    breaking caused by errors from gulp plugins (replaces pipe method
//    and removes standard onerror handler on errors event, which unpipes
//    streams on error by default). Pass in our errorAlert function
//    to the onerror handler.
// 4. Pipe stream through scsslint.
// 5. Compile using SASS, expanded style.
// 6. Auto-prefix (e.g. -moz-) using last 2 browser versions.
// 7. Output prefixed but non-minifed CSS to public/css
// 8. Rename to .min.css
// 9. Minify the CSS.
// 10. Output prefixed, minified CSS to public/css.

gulp.task('styles', function() {

	var outputDirectory = publicDirectory + 'css/' // [1]

	return gulp.src(config.files.styles)           // [2]
		.pipe(plumber({errorHandler: errorAlert})) // [3]
		.pipe(scsslint({                           // [4]
			'config': '.scss-lint.yml'
 		}))
		.pipe(sass({                               // [5]
			style : 'expanded'
		}))
		.pipe(autoprefixer('last 2 versions'))     // [6]
		.pipe(gulp.dest(outputDirectory))          // [7]
		.pipe(rename({ suffix : '.min' }))         // [8]
		.pipe(minifycss())                         // [9]
		.pipe(gulp.dest(outputDirectory));         // [10]

});





// Image optimisation task ---------------
// Minify PNG, JPEG, GIF and SVG images.
// Outputs a minified version into /public/images.
// ---------------------------------------
// 1. Assign our output directory to a variable.
// 2. Conditionally pipe stream through imagemin (if in config
//    var minifyImages == true).
// 3. Pipe the readable stream through gulp-plumber, which prevents pipe
//    breaking caused by errors from gulp plugins (replaces pipe method
//    and removes standard onerror handler on errors event, which unpipes
//    streams on error by default). Pass in our errorAlert function
//    to the onerror handler.
// 4. Determine whether to use imagemin or do nothing (noop).
// 5. Use files defined in files.images config.
// 6. Filter to only images that are newer than within public/images.
// 7. Output optimised images to public/images.

gulp.task('images', function() {

	var outputDirectory = publicDirectory + 'images/';             // [1]

	return gulp.src(config.files.images)                           // [2]
		.pipe(plumber({errorHandler: errorAlert}))                 // [3]
		.pipe(gulpif(config.minifyImages, imagemin({               // [4]
			optimizationLevel : 3,
			progressive : true,
			interlaced : true
		})))
		.pipe(newer(outputDirectory))                              // [5]
		.pipe(gulp.dest(outputDirectory));                         // [6]

});





// Watch task ----------------------------
// Sets up several watchers. Using different config for styles and
// templates as they have partials that need watching but not compiling.
// ---------------------------------------
// 1. Any changes to any files from files.watchStyles config starts styles task.
// 2. Any changes to any files from files.scripts config starts scripts task.
// 3. Any changes to any files from files.images config starts images task.

gulp.task('watch', function() {

	gulp.watch(config.files.watchStyles, ['styles']);	// [1]
	gulp.watch(config.files.scripts, ['scripts']);      // [2]
	gulp.watch(config.files.images, ['images']);        // [3]

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
	return gulp.src(config.files.copy, { base : config.copyBase }) // [1]
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
		process.kill(process.pid, 'SIGINT')
	};

	process.once('SIGINT', exitHandler);

	var outputDirectory = publicDirectory + '**/*'                 // [2]

	livereload.listen();                                           // [3]

	gulp.watch(outputDirectory).on(gulpif(config.autoReload, 'change'), livereload.changed);  // [4]

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

	var cyan    = gutil.colors.cyan,
		green   = gutil.colors.green;

	gutil.log(green('----------'));

	gutil.log(('The following main ') + cyan('tasks') + (' are available:'));

	gutil.log(cyan('build') + ': builds the contents to the public directory.');
	gutil.log(cyan('develop') + ': performs an initial build then sets up watches.');

	gutil.log(green('----------'));

});
