// server.js

// Set UTC
process.env.TZ = 'UTC';

const path = require('path');
const fs = require('fs-extra');

const express = require('express');
const app = express();
const session = require('express-session');

const globalConf = require('./config/global');
const dbConf = require('./config/database');
const appConf = require('./config/application');
// const appConf = JSON.parse(fs.readFileSync(__dirname + '/config/application.json'));

// MySql
if(dbConf.dialect == "mysql")
    var SessionStore = require('express-mysql-session');

// Postgres
if(dbConf.dialect == "postgres"){
    var pg = require('pg');
    var SessionStore = require('connect-pg-simple')(session);
}

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const passport = require('passport');
const flash = require('connect-flash');
const block_access = require('./utils/block_access');
const models = require('./models/');
const moment = require('moment');
const language = require('./services/language');

const extend = require('util')._extend;
const https = require('https');
const http = require('http');

// Winston logger
const logger = require('./utils/logger');

// DustJs
const dust = require('dustjs-linkedin');
const cons = require('consolidate');

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
    },
    stream: require('split')().on('data', function(line) {
        process.stdout.write(moment().format("YYYY-MM-DD HH:mm:ss-SSS") + " " + line + "\n");
    })
}));

require('console-stamp')(console, {
    formatter: function() {
        return moment().format('MM-DD HH:mm:ss');
    },
    label: false,
    datePrefix: "",
    dateSuffix: ""
});

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
        const at = initiator.split(__dirname)[1];
        if (!at)
            originalMethod.apply(console, [...args]);
        else
            originalMethod.apply(console, [...args, `   - ${at}`]);
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
	host: dbConf.host,
	port: dbConf.port,
	user: dbConf.user,
	password: dbConf.password,
	database: dbConf.database
};

if(dbConf.dialect == "mysql")
    var sessionStore = new SessionStore(options);

if(dbConf.dialect == "postgres"){
    var pgPool = new pg.Pool(options);
    pgPool.connect((err, client, done) => {
        if (err) {console.error(err);}
        client.query('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_catalog = \''+options.database+'\' AND table_name = \'sessions\');', (err, res) => {
            if (err) {console.error(err.stack)} else if(!res.rows[0].exists) {
                // Postgres sessions table do not exist, creating it...
                client.query(fs.readFileSync(__dirname + "/sql/sessions-for-postgres.sql", "utf8"), (err, res) => {
                    if (err) {console.error(err)} else {console.log("Postgres sessions table created !");}
                });
            }
        })
    })
    var sessionStore = new SessionStore({
        pool: pgPool,
        tableName: 'sessions'
    });
}

var sessionInstance = session({
	store: sessionStore,
	cookieName: 'workspaceCookie',
	secret: 'newmipsWorkspaceMakeyourlifebetter',
	resave: false,
    rolling: true,
	saveUninitialized: false,
	maxAge: 360*5,
	key: 'workspaceCookie'+globalConf.port // We concat port for a workspace specific session, instead of generator specific
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

    // If not a person (healthcheck service or other spamming services)
    if(typeof req.session.passport === "undefined" && Object.keys(req.headers).length == 0){return res.sendStatus(200);}

    let lang = appConf.lang;
    if (req.session.lang_user)
        lang = req.session.lang_user;
    else
    	req.session.lang_user = lang;

    if (typeof req.session.toastr === 'undefined')
		req.session.toastr = [];

    res.locals.lang_user = lang;
    res.locals.config = globalConf;

    // To use before calling renderSource function
    // Insert locals function in dustData
    dust.insertLocalsFn = function(locals, request){
        require("./utils/dust_fn").getLocals(locals, request, language(request.session.lang_user), block_access);
    }

    // Helpers / Locals / Filters
    require("./utils/dust_fn").getHelpers(dust);
    require("./utils/dust_fn").getLocals(res.locals, req, language(lang), block_access);
    require("./utils/dust_fn").getFilters(dust, lang);
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

	    		models.E_inline_help.findAll({where: {f_entity: {[models.$in]: entityList}}}).then(helps => {
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

models.sequelize.sync({logging: false, hooks: false}).then(() => {
    models.sequelize.customAfterSync().then(_ => {
        models.E_user.findAll().then(users => {
            let hasAdmin = false;

            // Check if user admin is in already created users
            for (var i = 0; i < users.length; i++) {
                if(users[i].f_login == "admin"){
                    hasAdmin = true
                }
            }

            if (!users || users.length == 0 || !hasAdmin) {
                models.E_group.create({
                    version: 0,
                    f_label: 'admin'
                }).then(group => {
                    models.E_role.create({
                        version: 0,
                        f_label: 'admin'
                    }).then(role => {
                        models.E_user.create({
                            f_login: 'admin',
                            f_password: null,
                            f_enabled: 0,
                            version: 0
                        }).then(user => {
                            user.setR_role(role.id);
                            user.setR_group(group.id);
                        });
                    });
                });
            }
        });
        var server;
        if (globalConf.protocol == 'https')
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

		server.listen(globalConf.port);
        if (globalConf.env == 'tablet') {
            try {
                const cordova = require('cordova-bridge');
                cordova.channel.send('STARTED');
            } catch(e) {console.error("Couldn't require 'cordova-bridge'");}
        }
		console.log("Started " + globalConf.protocol + " on " + globalConf.port + " !");
    }).catch(err => {
        console.error(err);
        logger.silly(err);
    })
}).catch(function(err) {
    console.error(err);
    logger.silly(err);
})

module.exports = app;
