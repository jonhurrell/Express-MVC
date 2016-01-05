var express = require('express'),
	config  = require('./config/config');

var app     = express();

require('./config/express')(app, config);

app.listen(config.port, function (error) {

	if (error) {
		console.log('Unable to listen for connections on %d, in %s mode.', config.port, app.get('env'), error);
	};

	console.log('Express server listening on %d, in %s mode.', config.port, app.get('env'));

});
