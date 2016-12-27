// server.js

// set up ======================================================================
// get all the tools we need
var path = require('path');
var express  = require('express');
var session  = require('express-session');
var SessionStore = require('express-mysql-session');
var dbconfig = require('./config/database');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app      = express();
var globalConf = require('./config/global');
var protocol = globalConf.protocol;
var port = globalConf.port;
var passport = require('passport');
var flash    = require('connect-flash');
var language = require('./services/language');
var languageConfig = require('./config/language');
var extend = require('util')._extend;
var https = require('https');
var http = require('http');
var fs = require('fs');

//DustJs
var dust = require('dustjs-linkedin');
var cons = require('consolidate');

// configuration ===============================================================
// connect to our database

// pass passport for configuration
require('./utils/authStrategies');

// set up our express application
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

//------------------------------ DUST.JS ------------------------------ //
app.engine('dust', cons.dust);
cons.dust.debugLevel = "DEBUG";
app.set('view engine', 'dust');
/*require("./custom_helpers.js");*/

//------------------------------ FIN DUST.JS ------------------------------ //

// required for passport
var options = {
	host: dbconfig.connection.host,
	port: dbconfig.connection.port,
	user: dbconfig.connection.user,
	password: dbconfig.connection.password,
	database: dbconfig.connection.database
};

var sessionStore = new SessionStore(options);

// CROSS DOMAINE FROM WORDPRESS
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
};
app.use(allowCrossDomain);

app.use(session({
	store: sessionStore,
	secret: 'newmipsmakeyourlifebetter',
	resave: true,
	saveUninitialized: true,
	maxAge: 360*5
 } )); // session secret
 app.use(passport.initialize());
 app.use(passport.session()); // persistent login sessions
 app.use(flash()); // use connect-flash for flash messages stored in session

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

	dust.helpers.__ = function(ch, con, bo, params) {
		return language(lang).__(params.key);
	}
	dust.helpers.M_ = function(ch, con, bo, params) {
		return language(lang).M_(params.key);
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

// routes ======================================================================
require('./routes/')(app);

// launch ======================================================================
if (protocol == 'https') {
	require('./models/').sequelize.sync({ logging: console.log, hooks: false }).then(function() {
		require('./models/').sequelize.customAfterSync().then(function(){
			var server = https.createServer(globalConf.ssl, app);
			server.listen(port);
			console.log("Started https on "+port);
		}).catch(function(err){
			console.log("ERROR - SYNC");
			console.log(err);
		});
	}).catch(function(err){
		console.log("ERROR - SYNC");
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
			console.log(err);
		});
	}).catch(function(err){
		console.log("ERROR - SYNC");
		console.log(err);
	});
}

module.exports = app;
