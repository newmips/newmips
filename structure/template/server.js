// server.js
process.env.TZ = 'UTC';
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
var moment = require('moment');

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

var sessionInstance = session({
	store: sessionStore,
	cookieName: 'workspaceCookie',
	secret: 'newmipsWorkspaceMakeyourlifebetter',
	resave: true,
	saveUninitialized: false,
	maxAge: 360*5,
	// We concat port for a workspace specific session, instead of generator specific
	key: 'workspaceCookie'+port
});
var socketSession = require('express-socket.io-session');

app.use(sessionInstance);

app.use(passport.initialize());
// Persistent login sessions
app.use(passport.session());

// Use connect-flash for flash messages stored in session
app.use(flash());

// Locals global ======================================================================
app.locals.moment = require('moment');

// Autologin for newmips's "iframe" live preview context
var startedFromGenerator = false;
// Global var used in block_access
AUTO_LOGIN = false;
if (process.argv[2] == 'autologin') {
	startedFromGenerator = true;
	AUTO_LOGIN = true;
}

// When application process is a child of generator process, log each routes for the generator
// to keep track of it, and redirect after server restart
if (startedFromGenerator) {
	app.get('/*', function(req, res, next) {
		var url = req.originalUrl;
		// Do not remove this comment
		if(url.indexOf("/inline_help/") != -1 || url.indexOf('/loadtab/') != -1 || req.query.ajax)
			return next();
		if (url.indexOf('/show') == -1 && url.indexOf('/list') == -1 && url.indexOf('/create') == -1 && url.indexOf('/update') == -1)
			return next();
		console.log("IFRAME_URL::"+url);
		next();
	});
}

//------------------------------ LOCALS ------------------------------ //
app.use(function(req, res, next) {
    var lang = languageConfig.lang;

    if(req.isAuthenticated()){
	    if (req.session.lang_user)
	        lang = req.session.lang_user;
	    else
	    	req.session.lang_user = lang;

	    if (typeof req.session.toastr === 'undefined')
			req.session.toastr = [];
    }

    res.locals.lang_user = lang;
    res.locals.config = globalConf;

    // When user is logged
	if (req.isAuthenticated() || AUTO_LOGIN) {
		// Session
		res.locals.session = req.session;

		// Access control
		dust.helpers.moduleAccess = function(chunk, context, bodies, params) {
			var userGroups = req.session.passport.user.r_group;
			var moduleName = params.module;
			return block_access.moduleAccess(userGroups, moduleName);
		};
		dust.helpers.entityAccess = function(chunk, context, bodies, params) {
			var userGroups = req.session.passport.user.r_group;
			var entityName = params.entity;
			return block_access.entityAccess(userGroups, entityName);
		}
		dust.helpers.actionAccess = function(chunk, context, bodies, params) {
			var userRoles = req.session.passport.user.r_role;
			var entityName = params.entity;
			var action = params.action;
			return block_access.actionAccess(userRoles, entityName, action);
		}
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
	dust.helpers.inArray = function(chunk, context, bodies, params) {
		var value = params.value;
		var field = params.field;
		var array = params.array;

		for(var i=0; i<array.length; i++){
			if(array[i][field] == value)
				return true
		}
		return false;
	}
	/* Filter DUST - example {myDate|convertToDateFormat} */
	dust.filters.date = function(value) {
		if (value != "") {
            if (lang == "fr-FR")
                return moment(new Date(value)).format("DD/MM/YYYY");
            else
                return moment(new Date(value)).format("YYYY-MM-DD");
        }
		return value;
	};

	dust.filters.datetime = function(value) {
		if (value != "") {
            if (lang == "fr-FR")
                return moment(new Date(value)).format("DD/MM/YYYY HH:mm:ss");
            else
                return moment(new Date(value)).format("YYYY-MM-DD HH:mm:ss");
        }
		return value;
	};

	dust.filters.time = function(value) {
		if (value != "") {
            if (value.length == 8)
                return value.substring(0, value.length - 3);
        }
		return value;
	};
    next();
});

app.use(function(req, res, next) {
	var redirect = res.redirect;
	res.redirect = function(view) {
		// If request comes from ajax call, no need to render show/list/etc.. pages, 200 status is enough
		if (req.query.ajax) {
			req.session.toastr = [];
			return res.sendStatus(200);
		}
		redirect.call(res, view);
	}

	// Overload res.render to always get and reset toastr, load notifications and inline-help helper
    var render = res.render;
    res.render = function(view, locals, cb) {
    	if(typeof locals === "undefined")
            locals = {};
    	if (req.session.toastr && req.session.toastr.length > 0) {
	        locals.toastr = req.session.toastr;
	        req.session.toastr = [];
        }

        // Load notifications
        var userId;
        try {
        	userId = req.session.passport.user.id;
        } catch(e) {
        	userId = null;
        }
        models.E_notification.findAndCountAll({
        	include: [{
        		model: models.E_user,
        		as: 'r_user',
        		where: {id: userId}
        	}],
        	subQuery: false,
        	order: 'createdAt DESC',
        	offset: 0,
        	limit: 10
        }).then(function(notifications) {
        	locals.notificationsCount = notifications.count;
        	locals.notifications = notifications.rows;

	        // Load inline-help when rendering create, update or show page
	    	if (view.indexOf('/create') != -1 || view.indexOf('/update') != -1 || view.indexOf('/show') != -1) {
	    		var entityName = view.split('/')[0];
	    		var options;
	    		try {
	    			options = JSON.parse(fs.readFileSync(__dirname+'/models/options/'+entityName+'.json', 'utf8'));
	    		} catch(e) {
	    			// No options file, always return false
	    			dust.helpers.inline_help = function(){return false;}
	    			return render.call(res, view, locals, cb);
	    		}
	    		var entityList = [entityName];
	    		for (var i = 0; i < options.length; i++)
	    			entityList.push(options[i].target);

	    		models.E_inline_help.findAll({where: {f_entity: {$in: entityList}}}).then(function(helps) {
	    			dust.helpers.inline_help = function(ch, con, bod, params){
	    				for (var i = 0; i < helps.length; i++) {
	    					if (params.field == helps[i].f_field)
	    						return true;
	    				}
	    				return false;
	    			}

			        render.call(res, view, locals, cb);
	    		});
	    	}
	    	else
	        	render.call(res, view, locals, cb);
        });
    };
    next();
});

// Routes ======================================================================
require('./routes/')(app);

// Api routes ==================================================================
require('./api/')(app);

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Handle 404
app.use(function(req, res) {
	res.status(404);
	res.render('common/404');
});

// Launch ======================================================================
if (protocol == 'https') {
	models.sequelize.sync({ logging: false, hooks: false }).then(function() {
		models.sequelize.customAfterSync().then(function(){
			models.E_user.findAll().then(function(users) {
				if (!users || users.length == 0) {
                    models.E_group.create({f_label: 'admin'}).then(function(){
                        models.E_role.create({f_label: 'admin'}).then(function(){
                            models.E_user.create({
                                f_login: 'admin',
                                f_password: null,
                                f_enabled: 0
                            }).then(function(user) {
                            	user.setR_role(1);
                            	user.setR_group(1);
                            });
                        });
                    });
                }
			});
			var server = https.createServer(globalConf.ssl, app);

			if (globalConf.socket.enabled) {
				io = require('socket.io')(server);
				// Provide shared express session to sockets
				io.use(socketSession(sessionInstance));
				require('./services/socket')(io);
			}

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
                                f_enabled: 0,
                                version: 0
                            }).then(function(user) {
                            	user.setR_role(1);
                            	user.setR_group(1);
                            });
                        });
                    });
                }
			});
			var server = http.createServer(app);

			if (globalConf.socket.enabled) {
				io = require('socket.io')(server);
				// Provide shared express session to sockets
				io.use(socketSession(sessionInstance));
				require('./services/socket')(io);
			}

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
