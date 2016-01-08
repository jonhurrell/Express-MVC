require('dotenv').load();

var path     = require('path'),
	rootPath = path.normalize(__dirname + '/..');

var config = {
	    env: process.env.NODE_ENV,
		root: rootPath,
		port: process.env.PORT,
		livereloadPort : 35729,

	db: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT
	}
};

module.exports = config;
