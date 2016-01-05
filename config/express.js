// Middleware
var express           = require('express');

// Requires
var nunjucks          = require('nunjucks'),
    favicon           = require('serve-favicon'),
    connectLivereload = require('connect-livereload'),
    morgan            = require('morgan'),
    compress          = require('compression'),
    methodOverride    = require('method-override'),
    bodyParser        = require('body-parser'),
    cookieParser      = require('cookie-parser'),
    glob              = require('glob');





// Let's export the setup function to utilise in other files (app.js).
module.exports = function(app, config) {

	// Setup views ---------------------------
	// The app uses nunjucks as the template engine.
	// nunjucks loads templates from the filesystem by default, and loads
	// them over HTTP in the browser.
	// By default, nunjucks will escape all output, so dynamically-generated data is
	// displayed safely the templates.
	// ---------------------------------------
	// 1. Set the directory where the template files are located.
	// 2. Set the template engine to use nunjucks.
	// 3. Tell nunjucks we are using express to serve the templates within
	//    the /app/views directory.

	app.set('views' + '/app/views');                                     // [1]
	app.set('view engine', 'nunjucks');                                  // [2]
	nunjucks.configure(config.root + '/app/views', {
		express: app                                                     // [3]
	});





	// To serve static files such as images, CSS files, and JavaScript
	// files, we use the express.static built-in middleware function
	// in Express.
	app.use(express.static(config.root + '/public'));




	// Serve the 'default, implicit favicon', using the serve-favicon
	// middleware function.
	// app.use(favicon(config.root + '/public/images/favicon.ico'));





	// LiveReload if in development environment.

	if (app.get('env') === 'development') {

		console.log('LiveReload using port ' + config.livereloadPort);
		app.use(connectLivereload({ port : config.livereloadPort }));

	}





	// Log HTTP requests to the console if in development environment

	if (app.get('env') === 'development')  {
		app.use(morgan('dev'));
	}





	// Utilities -----------------------------
	// body-parser is middleware that reads form data from a POST request
	// and encodes it as a JavaScript object on `req.body`.
	// Add support for the specific encoding we require.
	// ---------------------------------------
	// 1. Compress response bodies for all requests, based on the default
	//    options.
	// 2. Let's you use HTTP verbs such as PUT or DELETE in places where the
	//    client doesn't support it.
	// 3. Parse and encode form data as JSON as a new body object
	//    on `req.body`.
	// 4. Parse and encode form data as URL encoded data (which is how
	//    browsers tend to send form data from regular forms set to POST)
	//    as a new body object (containing the keys and values) on `req.body`.
	//    The 'extended' (option key) syntax allows for rich objects and
	//    arrays to be encoded into the URL-encoded format, allowing for a
	//    JSON-like experience with URL-encoded.
	// 5. Parse Cookie header and populate `req.cookies` with an object
	//    keyed by the cookie names. Optionally you may enable signed cookie
	//    support by passing a secret string, which assigns `req.secret` so
	//    it may be used by other middleware.

	app.use(compress());                                                 // [1]
	app.use(methodOverride());                                           // [2]
	app.use(bodyParser.json());                                          // [3]
	app.use(bodyParser.urlencoded({ extended: true }));                  // [4]
	app.use(cookieParser());                                             // [5]





	// Setup controllers ---------------------
	// The controller files contain the routes, routing middlewares,
	// business logic, template rendering and dispatching.
	// ---------------------------------------
	// 1. Perform a synchronous glob (pattern match) search on any JavaScript
	//    files in /app/controllers.
	// 2. Loop through the controllers directory and require each controller
	//    file within it, passing in the express app.

	var controllers = glob.sync(config.root + '/app/controllers/*.js');  // [1]
	controllers.forEach(function (controller) {                          // [2]
		require(controller)(app);
	});





	// Error handling ------------------------
	// The controller files contain the routes, routing middlewares,
	// business logic, template rendering and dispatching.
	// ---------------------------------------

	app.use(function (req, res, next) {

		var err = new Error('Not Found');
		err.status = 404;
		next(err);

	});

	if(app.get('env') === 'development') {

		app.use(function (err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err,
				title: 'error'
			});
		});

	}

	app.use(function (err, req, res, next) {

		res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: {},
				title: 'error'
			});
		});

};
