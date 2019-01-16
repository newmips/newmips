// server.js
process.env.TZ = 'UTC';
// Set up ======================================================================
// Get all the tools we need
var path = require('path');
var express = require('express');
var session = require('express-session');
var dbConfig = require('./config/database');

// MySql
if(dbConfig.dialect == "mysql")
    var SessionStore = require('express-mysql-session');

// Postgres
if(dbConfig.dialect == "postgres"){
    var pg = require('pg');
    var SessionStore = require('connect-pg-simple')(session);
}

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
var globalConf = require('./config/global');
var protocol = globalConf.protocol;
var port = globalConf.port;
var passport = require('passport');
var flash = require('connect-flash');
var block_access = require('./utils/block_access');
var models = require('./models/');
var moment = require('moment');

// Language
var language = require('./services/language');
var languageConfig = require('./config/language');

var extend = require('util')._extend;
var https = require('https');
var http = require('http');
var fs = require('fs-extra');

// Winston logger
var logger = require('./utils/logger');

// DustJs
var dust = require('dustjs-linkedin');
var cons = require('consolidate');

// Configuration ===============================================================

// Pass passport for configuration
require('./utils/auth_strategies');

// Set up public files access (js/css...)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

// Set up API documentation access
app.use('/api_documentation', express.static(__dirname + '/api/doc/website'));

// Log every request (not /) to the console
app.use(morgan('dev', {
    skip: function(req, res) {
        if(req.url == "/")
        	return true;
    }
}));

// Overide console.warn & console.error to file+line
['warn', 'error'].forEach((methodName) => {
    const originalMethod = console[methodName];
    console[methodName] = (...args) => {
        let initiator = 'unknown place';
        try {
            throw new Error();
        } catch (e) {
            if (typeof e.stack === 'string') {
                let isFirst = true;
                for (const line of e.stack.split('\n')) {
                    const matches = line.match(/^\s+at\s+(.*)/);
                    if (matches) {
                        if (!isFirst) {
                            // first line - current function
                            // second line - caller (what we are looking for)
                            initiator = matches[1];
                            break;
                        }
                        isFirst = false;
                    }
                }
            }
        }
        originalMethod.apply(console, [...args, '-', `${initiator.split(__dirname)[1]}`]);
    };
});

// Read cookies (needed for auth)
app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true,
	limit: '50mb',
	parameterLimit: 1000000
}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));

//------------------------------ DUST.JS ------------------------------ //
app.engine('dust', cons.dust);
cons.dust.debugLevel = "DEBUG";
app.set('view engine', 'dust');

// Required for passport
var options = {
	host: dbConfig.host,
	port: dbConfig.port,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database
};

if(dbConfig.dialect == "mysql")
    var sessionStore = new SessionStore(options);

if(dbConfig.dialect == "postgres"){
    var pgPool = new pg.Pool(options);
    var sessionStore = new SessionStore({
        pool: pgPool
    });
}

var sessionInstance = session({
	store: sessionStore,
	cookieName: 'workspaceCookie',
	secret: 'newmipsWorkspaceMakeyourlifebetter',
	resave: true,
	saveUninitialized: false,
	maxAge: 360*5,
	key: 'workspaceCookie'+port // We concat port for a workspace specific session, instead of generator specific
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
		if (url.indexOf('/show') == -1 && url.indexOf('/list') == -1 && url.indexOf('/create') == -1 && url.indexOf('/update') == -1 && url.indexOf('/default/home') == -1)
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
    res.locals.clean = function(item) {
        if (item === undefined || item === null)
            return '';
        return item;
    }

    require("./utils/dust_helper")(req, res, dust, language, lang, block_access);
    next();
});

app.use(function(req, res, next) {
	var redirect = res.redirect;
	res.redirect = function(view) {
		// If request comes from ajax call, no need to render show/list/etc.. pages, 200 status is enough
		if (req.query.ajax) {
			// Check role access error in toastr. Send 403 if found, {refresh: true} will force reload of the page (behavior comes from public/newmips/show.js)
			for (var i = 0; i < req.session.toastr.length; i++) {
				var toast = req.session.toastr[i];
				if (toast.message && toast.message == "settings.auth_component.no_access_role")
					return res.status(403).send({refresh: true});
			}
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
        	order: [["createdAt", "DESC"]],
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

models.sequelize.sync({logging: false, hooks: false}).then(function() {
    models.sequelize.customAfterSync().then(function() {
        models.E_user.findAll().then(function(users) {
            if (!users || users.length == 0) {
                models.E_group.create({
                	id: 1,
                    version: 0,
                    f_label: 'admin'
                }).then(function() {
                    models.E_role.create({
                    	id: 1,
                        version: 0,
                        f_label: 'admin'
                    }).then(function() {
                        models.E_user.create({
                        	id: 1,
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
        var server;
        if (protocol == 'https')
            server = https.createServer(globalConf.ssl, app);
        else
            server = http.createServer(app);

        if (globalConf.socket.enabled) {
            io = require('socket.io')(server);
            // Provide shared express session to sockets
            io.use(socketSession(sessionInstance));
            require('./services/socket')(io);
        }

		// Handle access.json file for various situation
		block_access.accessFileManagment();

		server.listen(port);
		console.log("Started " + protocol + " on " + port + " !");
    }).catch(function(err) {
        console.error(err);
        logger.silly(err);
    })
}).catch(function(err) {
    console.error(err);
    logger.silly(err);
})

module.exports = app;
