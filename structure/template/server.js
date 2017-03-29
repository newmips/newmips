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
var block_access = require('./utils/block_access');
var models = require('./models/');

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

// Set up public files access (js/css...)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

// Set up API documentation access
app.use('/api_documentation', express.static(__dirname + '/api/doc/website'));

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

// Required for passport
var options = {
	host: dbconfig.connection.host,
	port: dbconfig.connection.port,
	user: dbconfig.connection.user,
	password: dbconfig.connection.password,
	database: dbconfig.connection.database
};
var sessionStore = new SessionStore(options);

app.use(session({
	store: sessionStore,
	cookieName: 'workspaceCookie',
	secret: 'newmipsWorkspaceMakeyourlifebetter',
	resave: true,
	saveUninitialized: true,
	maxAge: 360*5,
	// We concat port for a workspace specific session, instead of generator specific
	key: 'workspaceCookie'+port
 }));
 app.use(passport.initialize());
 // Persistent login sessions
 app.use(passport.session());

 // Use connect-flash for flash messages stored in session
 app.use(flash());

// Locals global ======================================================================
app.locals.moment = require('moment');

// Autologin for newmips's "iframe" live preview context
var autologin = false;var autologinInited = false;var startedFromGenerator = false;
if (process.argv[2] == 'autologin') {
	startedFromGenerator = true;
	autologin = true;
}

// When application process is a child of generator process, log each routes for the generator
// to keep track of it, and redirect after server restart
if (startedFromGenerator) {
	app.get('/*', function(req, res, next){
		console.log("IFRAME_URL::"+req.originalUrl);
		next();
	});
}

//------------------------------ LOCALS ------------------------------ //
app.use(function(req, res, next) {
	if (typeof req.session.autologin === 'undefined' || autologinInited == false) {
		autologinInited = true;
		req.session.autologin = autologin;
	}

    var lang = languageConfig.lang;

    if (req.session.lang_user)
        lang = req.session.lang_user;
    else
    	req.session.lang_user = lang;

    res.locals.lang_user = lang;

    // When user is logged
	if (req.isAuthenticated() || autologin) {
		// Session
		res.locals.session = req.session;

		// Access control
		dust.helpers.moduleAccess = function(chunk, context, bodies, params) {
			var userGroup = req.session.passport.user.r_group.f_label;
			var moduleName = params.module;
			return block_access.moduleAccess(userGroup, moduleName);
		};
		dust.helpers.entityAccess = function(chunk, context, bodies, params) {
			var userGroup = req.session.passport.user.r_group.f_label;
			var entityName = params.entity;
			return block_access.entityAccess(userGroup, entityName);
		}
		dust.helpers.actionAccess = function(chunk, context, bodies, params) {
			var userRole = req.session.passport.user.r_role.f_label;
			var entityName = params.entity;
			var action = params.action;
			return block_access.actionAccess(userRole, entityName, action);
		}
	}

	if (typeof req.session.toastr === 'undefined')
		req.session.toastr = [];

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

		var idx = 0;
		for(var i=0; i<obj.length; i++){
			if(obj[i].id == params.idx)
				idx = i;
		}

		if(typeof params.entity !== "undefined"){
			if(typeof obj[idx][params.entity] !== "undefined" && obj[idx][params.entity] != null)
				return chunk.write(obj[idx][params.entity][params.key]);
			else
				return chunk.write("-");
		}
		else
			return chunk.write(obj[idx][params.key]);
	}
	dust.helpers.existInContextById = function(chunk, context, bodies, params) {
		var obj = dust.helpers.tap(params.ofContext, chunk, context);
		for(var i=0; i<obj.length; i++){
			if(obj[i].id == params.key)
				return true;
		}
		return false;
	}
	dust.helpers.ifTrue = function(chunk, context, bodies, params) {
		var value = params.key;

		if(value == true || value == "true" || value == 1){
			return true;
		} else{
			return false;
		}
	}
    next();
});

// Overload res.render to always get and reset toastr
app.use(function(req, res, next) {
    var render = res.render;
    res.render = function(view, locals, cb) {
    	if(typeof locals === "undefined"){
            var locals = {};
        }
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

// Api routes ==================================================================
require('./api/')(app);

// Handle 404
app.use(function(req, res) {
	res.status(400);
	res.render('common/404');
});

// Launch ======================================================================
if (protocol == 'https') {
	models.sequelize.sync({ logging: console.log, hooks: false }).then(function() {
		models.sequelize.customAfterSync().then(function(){
			models.E_user.findAll().then(function(users) {
				if (!users || users.length == 0) {
                    models.E_group.create({f_label: 'admin'}).then(function(){
                        models.E_role.create({f_label: 'admin'}).then(function(){
                            models.E_user.create({
                                f_login: 'admin',
                                f_password: null,
                                f_id_role_role: 1,
                                f_id_group_group: 1,
                                f_enabled: 0
                            });
                        });
                    });
                }
			});
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
	models.sequelize.sync({ logging: false, hooks: false }).then(function() {
		models.sequelize.customAfterSync().then(function(){
			models.E_user.findAll().then(function(users) {
				if (!users || users.length == 0) {
                    models.E_group.create({version:0, f_label: 'admin'}).then(function(){
                        models.E_role.create({version:0, f_label: 'admin'}).then(function(){
                            models.E_user.create({
                                f_login: 'admin',
                                f_password: null,
                                f_id_role_role: 1,
                                f_id_group_group: 1,
                                f_enabled: 0,
                                version: 0
                            });
                        });
                    });
                }
			});
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
