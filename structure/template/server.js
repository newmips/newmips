// server.js

// Set up ======================================================================
// Get all the tools we need
var path = require('path');
var express  = require('express');
var session  = require('express-session');
var SessionStore = require('express-mysql-session');
var dbconfig = require('./config/database');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
var globalConf = require('./config/global');
var protocol = globalConf.protocol;
var port = globalConf.port;
var passport = require('passport');
var flash    = require('connect-flash');

// Language
var language = require('./services/language');
var languageConfig = require('./config/language');

var extend = require('util')._extend;
var https = require('https');
var http = require('http');
var fs = require('fs');

// Winston logger
var logger = require('./utils/logger');

// DustJs
var dust = require('dustjs-linkedin');
var cons = require('consolidate');

// Configuration ===============================================================

// Pass passport for configuration
require('./utils/authStrategies');

// Set up our express application
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

// Log every request to the console
app.use(morgan('dev'));

// Read cookies (needed for auth)
app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));

//------------------------------ DUST.JS ------------------------------ //
app.engine('dust', cons.dust);
cons.dust.debugLevel = "DEBUG";
app.set('view engine', 'dust');

// // Required for passport
// var options = {
// 	host: dbconfig.connection.host,
// 	port: dbconfig.connection.port,
// 	user: dbconfig.connection.user,
// 	password: dbconfig.connection.password,
// 	database: dbconfig.connection.database
// };
// var sessionStore = new SessionStore(options);

app.use(session({
	cookieName: 'workspaceCookie',
	secret: 'newmipsWorkspaceMakeyourlifebetter',
	resave: true,
	saveUninitialized: true,
	maxAge: 360*5,
	key: 'workspaceCookie'
 } )); // session secret
 app.use(passport.initialize());

 // Persistent login sessions
 app.use(passport.session());

 // Use connect-flash for flash messages stored in session
 app.use(flash());

// Locals global ======================================================================
app.locals.moment = require('moment');

//------------------------------ LANGUAGE ------------------------------ //
app.use(function(req, res, next) {
    var lang = languageConfig.lang;

    if (req.session.lang_user){
        lang = req.session.lang_user;
    }
    else{
    	req.session.lang_user = lang;
    }

    res.locals.lang_user = lang;

    // When user is logged
	if (req.isAuthenticated()) {
		// Session
		res.locals.session = req.session;
	}

	res.locals.clean = function(item){
		if (item === undefined || item === null)
			return '';
		return item;
	}

	// Create dust helper
	dust.helpers.__ = function(ch, con, bo, params) {
		return language(lang).__(params.key);
	}
	dust.helpers.M_ = function(ch, con, bo, params) {
		return language(lang).M_(params.key);
	}
	dust.helpers.findValueInGivenContext = function(chunk, context, bodies, params) {

		var obj = dust.helpers.tap(params.ofContext, chunk, context);
		/*var prop = dust.helpers.tap(params.key, chunk, context);*/

		var idx = 0;

		for(var i=0; i<obj.length; i++){
			if(obj[i].id == params.idx){
				idx = i;
			}
		}

		if(typeof params.entity !== "undefined"){
			if(typeof obj[idx][params.entity] !== "undefined" && obj[idx][params.entity] != null)
				return chunk.write(obj[idx][params.entity][params.key]);
			else
				return chunk.write("-");
		}
		else{
			return chunk.write(obj[idx][params.key]);
		}
	}
    next();
});

// Overload res.render to always get and reset toastr
app.use(function(req, res, next) {
    var render = res.render;
    res.render = function(view, locals, cb) {
    	if (req.session.toastr && req.session.toastr.length > 0) {
	        locals.toastr = req.session.toastr;
	        req.session.toastr = [];
        }
        render.call(res, view, locals, cb);
    };
    next();
});

// Routes ======================================================================
require('./routes/')(app);

// Launch ======================================================================
if (protocol == 'https') {
	require('./models/').sequelize.sync({ logging: console.log, hooks: false }).then(function() {
		require('./models/').sequelize.customAfterSync().then(function(){
			var server = https.createServer(globalConf.ssl, app);
			server.listen(port);
			console.log("Started https on "+port);
		}).catch(function(err){
			console.log("ERROR - SYNC");
			logger.silly(err);
			console.log(err);
		});
	}).catch(function(err){
		console.log("ERROR - SYNC");
		logger.silly(err);
		console.log(err);
	});
}
else {
	require('./models/').sequelize.sync({ logging: console.log, hooks: false }).then(function() {
		require('./models/').sequelize.customAfterSync().then(function(){
			var server = http.createServer(app);
			server.listen(port);
			console.log("Started on "+port);
		}).catch(function(err){
			console.log("ERROR - SYNC");
			logger.silly(err);
			console.log(err);
		});
	}).catch(function(err){
		console.log("ERROR - SYNC");
		logger.silly(err);
		console.log(err);
	});
}

module.exports = app;
