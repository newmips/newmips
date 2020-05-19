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

let SessionStore, pg;
// MySql
if(dbConf.dialect == "mysql")
	SessionStore = require('express-mysql-session'); // eslint-disable-line
// Postgres
if(dbConf.dialect == "postgres"){
	pg = require('pg'); // eslint-disable-line
	SessionStore = require('connect-pg-simple')(session); // eslint-disable-line
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
const https = require('https');
const http = require('http');

// DustJs
const dust = require('dustjs-linkedin');
const cons = require('consolidate');

// Pass passport for configuration
require('./utils/auth_strategies');

// Autologin for newmips's "iframe" live preview context
let startedFromGenerator = false;
// Global var used in block_access
AUTO_LOGIN = false; // eslint-disable-line
if (process.argv[2] == 'autologin') {
	startedFromGenerator = true;
	AUTO_LOGIN = true; // eslint-disable-line
}

// Set up public files access (js/css...)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

// Log every request (not /) to the console
const morganConf = {
	skip: req => {
		if(req.url == "/")
			return true;
	}
}

if (!startedFromGenerator)
	morganConf.stream = require('split')().on('data', line => process.stdout.write(moment().tz('Europe/Paris').format("YYYY-MM-DD HH:mm:ss-SSS") + " " + line + "\n"));  // eslint-disable-line

app.use(morgan('dev', morganConf));
if (!startedFromGenerator) {
	require('console-stamp')(console, { // eslint-disable-line
		formatter: function() {
			return moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss-SSS');
		},
		label: false,
		datePrefix: "",
		dateSuffix: ""
	});
}

// Overide console.warn & console.error to file + line
['warn', 'error'].forEach(methodName => {
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
const options = {
	host: dbConf.host,
	port: dbConf.port,
	user: dbConf.user,
	password: dbConf.password,
	database: dbConf.database
};

let sessionStore;
if(dbConf.dialect == "mysql")
	sessionStore = new SessionStore(options);

if(dbConf.dialect == "postgres"){
	const pgPool = new pg.Pool(options);
	pgPool.connect((err, client) => {
		if (err) {console.error(err);}
		client.query('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_catalog = \''+options.database+'\' AND table_name = \'sessions\');', (err, res) => {
			if (err) {console.error(err.stack)} else if(!res.rows[0].exists) {
				// Postgres sessions table do not exist, creating it...
				client.query(fs.readFileSync(__dirname + "/sql/sessions-for-postgres.sql", "utf8"), err => {
					if (err) {console.error(err)} else {console.log("Postgres sessions table created !");}
				});
			}
		})
	})
	sessionStore = new SessionStore({
		pool: pgPool,
		tableName: 'sessions'
	});
}

const sessionInstance = session({
	store: sessionStore,
	cookieName: 'workspaceCookie',
	secret: 'newmipsWorkspaceMakeyourlifebetter',
	resave: false,
	rolling: true,
	saveUninitialized: false,
	maxAge: 360*5,
	key: 'workspaceCookie'+globalConf.port // We concat port for a workspace specific session, instead of generator specific
});
const socketSession = require('express-socket.io-session');

app.use(sessionInstance);

app.use(passport.initialize());
// Persistent login sessions
app.use(passport.session());

// Set quick access to user in session through req.user
// This middleware needs to stay after passport initialization
app.use((req, res, next) => {
	try {
		req.user = req.session.passport.user;
	} catch(e) {
		req.user = null;
	}
	next();
});

// Use connect-flash for flash messages stored in session
app.use(flash());

// Locals global ======================================================================
app.locals.moment = require('moment');

// When application process is a child of generator process, log each routes for the generator
// to keep track of it, and redirect after server restart
if (startedFromGenerator) {
	app.get('/*', (req, res, next) => {
		const url = req.originalUrl;
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
const dustFn = require("./utils/dust_fn"); // eslint-disable-line
app.use((req, res, next) => {

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
	dust.insertLocalsFn = (locals, request) => {
		dustFn.getHelpers(dust);
		dustFn.getLocals(locals, request, language(request.session.lang_user), block_access);
		dustFn.getFilters(dust, lang);
	}

	// Helpers / Locals / Filters
	dustFn.getHelpers(dust);
	dustFn.getLocals(res.locals, req, language(lang), block_access);
	dustFn.getFilters(dust, lang);
	next();
});

app.use((req, res, next) => {
	const redirect = res.redirect;
	res.redirect = view => {
		// If request comes from ajax call, no need to render show/list/etc.. pages, 200 status is enough
		if (req.query.ajax) {
			// Check role access error in toastr. Send 403 if found, {refresh: true} will force reload of the page (behavior comes from public/newmips/show.js)
			for (let i = 0; i < req.session.toastr.length; i++) {
				const toast = req.session.toastr[i];
				if (toast.message && toast.message == "settings.auth_component.no_access_role")
					return res.status(403).send({refresh: true});
			}
			req.session.toastr = [];
			return res.sendStatus(200);
		}
		redirect.call(res, view);
	}

	// Overload res.render to always get and reset toastr, load notifications and inline-help helper
	const render = res.render;
	res.render = (view, locals, cb) => {
		if(typeof locals === "undefined")
			locals = {};
		if (req.session.toastr && req.session.toastr.length > 0) {
			locals.toastr = req.session.toastr;
			req.session.toastr = [];
		}

		// Load notifications
		let userId;
		try {
			userId = req.session.passport.user.id;
		} catch(e) {
			userId = null;
		}

		(async () => {

			// --- User Guide ---
			locals.user_guide = await models.E_user_guide.findByPk(1);

			// --- Notificiation ---
			const notifications = await models.E_notification.findAndCountAll({
				include: [{
					model: models.E_user,
					as: 'r_user',
					where: {id: userId}
				}],
				subQuery: false,
				order: [["createdAt", "DESC"]],
				offset: 0,
				limit: 10
			});

			locals.notificationsCount = notifications.count;
			locals.notifications = notifications.rows;

			// --- Inline Help ---
			if (view.indexOf('/create') == -1 && view.indexOf('/update') == -1 && view.indexOf('/show') == -1)
				return;

			// Load inline-help when rendering create, update or show page
			const entityName = view.split('/')[0];
			let options;
			try {
				options = JSON.parse(fs.readFileSync(__dirname + '/models/options/' + entityName + '.json', 'utf8'));
			} catch (e) {
				// No options file, always return false
				dust.helpers.inline_help = () => false;
				throw e;
			}

			const entityList = [entityName];
			for (let i = 0; i < options.length; i++)
				entityList.push(options[i].target);

			const helps = await models.E_inline_help.findAll({where: {f_entity: {[models.$in]: entityList}}});
			dust.helpers.inline_help = (ch, con, bod, params) => {
				for (let i = 0; i < helps.length; i++) {
					if (params.field == helps[i].f_field)
						return true;
				}
				return false;
			}
		})().then(_ => {
			render.call(res, view, locals, cb);
		}).catch(err => {
			console.error(err);
			render.call(res, view, locals, cb);
		});
	};
	next();
});

// Routes ======================================================================
require('./routes/')(app);

// Api routes ==================================================================
require('./api/')(app);

// Set up API documentation access
app.use('/api_documentation', block_access.isLoggedIn, express.static(__dirname + '/api/doc/website'));

app.use((req, res, next) => {
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

models.sequelize.sync({logging: false, hooks: false}).then(_ => {
	models.sequelize.customAfterSync().then(_ => {
		models.E_user.findAll().then(users => {
			let hasAdmin = false;

			// Check if user admin is in already created users
			for (let i = 0; i < users.length; i++) {
				if(users[i].f_login == "admin"){
					hasAdmin = true
				}
			}

			if (!users || users.length == 0 || !hasAdmin) {
				const user = {f_login: 'system'};
				models.E_group.create({
					version: 0,
					f_label: 'admin'
				}, {user}).then(group => {
					models.E_role.create({
						version: 0,
						f_label: 'admin'
					}, {user}).then(role => {
						models.E_user.create({
							f_login: 'admin',
							f_password: null,
							f_enabled: 0,
							version: 0
						}, {user}).then(user => {
							user.setR_role(role.id);
							user.setR_group(group.id);
						});
					});
				});
			}
		});
		let server;
		if (globalConf.protocol == 'https')
			server = https.createServer(globalConf.ssl, app);
		else
			server = http.createServer(app);

		let io = false;
		if (globalConf.socket.enabled) {
			io = require('socket.io')(server); // eslint-disable-line
			// Provide shared express session to sockets
			io.use(socketSession(sessionInstance));
			require('./services/socket')(io); // eslint-disable-line
		}

		// Handle access.json file for various situation
		block_access.accessFileManagment();

		server.listen(globalConf.port);
		if (globalConf.env == 'tablet') {
			try {
				const cordova = require('cordova-bridge'); // eslint-disable-line
				cordova.channel.send('STARTED');
			} catch(e) {console.error("Couldn't require 'cordova-bridge'");}
		}
		console.log("Started " + globalConf.protocol + " on " + globalConf.port + " !");
	}).catch(err => {
		console.error(err);
	})
}).catch(err => {
	console.error(err);
})

module.exports = app;