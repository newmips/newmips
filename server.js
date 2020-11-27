// Set up ======================================================================
// Get all the tools we need
const path = require('path');
const express = require('express');
const session = require('express-session');
const dbConfig = require('./config/database');

let SessionStore, pg;
// MySql
if(dbConfig.dialect == "mysql")
	SessionStore = require('express-mysql-session'); // eslint-disable-line
// Postgres
if(dbConfig.dialect == "postgres"){
	pg = require('pg'); // eslint-disable-line
	SessionStore = require('connect-pg-simple')(session); // eslint-disable-line
}

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const globalConf = require('./config/global');
const protocol = globalConf.protocol;
const port = globalConf.port;
const passport = require('passport');
const flash = require('connect-flash');
const language = require('./services/language');
const https = require('https');
const fs = require('fs-extra');
const split = require('split');
const AnsiToHTML = require('ansi-to-html');
const ansiToHtml = new AnsiToHTML();
const moment = require('moment');
const models = require('./models/');

// Passport for configuration
require('./utils/authStrategies');

// set up our express application
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

const allLogStream = fs.createWriteStream(path.join(__dirname, 'all.log'), {
	flags: 'a'
});

app.use(morgan('dev', {
	skip: function(req) {
		// Remove spamming useless logs
		const skipArray = ["/update_logs", "/get_pourcent_generation", "/status", "/completion", "/watch", "/"];
		let currentURL = req.originalUrl;
		if (currentURL.indexOf("?") != -1) {
			// Remove params from URL
			currentURL = currentURL.split("?")[0];
		}
		if (skipArray.indexOf("/"+currentURL.split("/")[currentURL.split("/").length -1]) != -1) {
			return true;
		}
	},
	stream: split().on('data', function(line) {
		if (allLogStream.bytesWritten < 5000) {
			if(globalConf.env != "develop"){
				allLogStream.write(moment().tz('Europe/Paris').format("MM-DD HH:mm:ss") + ": " + ansiToHtml.toHtml(line) + "\n");
				process.stdout.write(moment().tz('Europe/Paris').format("MM-DD HH:mm:ss") + " " + line + "\n");
			} else {
				allLogStream.write(ansiToHtml.toHtml(line) + "\n");
				process.stdout.write(line + "\n");
			}
		} else {
			/* Clear all.log if too much bytes are written */
			fs.writeFileSync(path.join(__dirname, 'all.log'), '');
			allLogStream.bytesWritten = 0;
		}
	})
}));

// Overide console.warn & console.error to file+line
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

app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true,
	limit: "50mb"
}));
app.use(bodyParser.json({
	limit: '50mb'
}));

//------------------------------ DUST.JS ------------------------------ //
const dust = require('dustjs-linkedin');
const cons = require('consolidate');

app.set('views', path.join(__dirname, 'views'));
app.engine('dust', cons.dust);
cons.dust.debugLevel = "DEBUG";
app.set('view engine', 'dust');

// Required for passport
const options = {
	host: dbConfig.host,
	port: dbConfig.port,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database
};

let sessionStore;
if(dbConfig.dialect == "mysql")
	sessionStore = new SessionStore(options);
if(dbConfig.dialect == "postgres"){
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
app.use(session({
	store: sessionStore,
	cookieName: 'newmipsCookie',
	secret: 'newmipsmakeyourlifebetter',
	resave: false,
	rolling: true,
	saveUninitialized: false,
	maxAge: 360 * 5,
	key: 'newmipsCookie'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Locals ======================================================================
app.use(function(req, res, next) {
	// If not a person (healthcheck service or other spamming services)
	if(typeof req.session.passport === "undefined" && Object.keys(req.headers).length == 0){return res.sendStatus(200);}

	// Applications created with newmips only have fr-FR.
	// To avoid cookie conflict between newmips and this app, set fr-FR by default
	let lang = 'fr-FR';
	if (req.isAuthenticated()) {
		if (req.session.lang_user)
			lang = req.session.lang_user;
		else
			req.session.lang_user = lang;
	}

	req.moment = require('moment'); // eslint-disable-line
	if(lang == "fr-FR")
		req.moment.locale('fr');

	// Helpers
	dust.helpers.ifTrue = (chunk, context, bodies, params) => {
		const value = params.key;

		if(value == true || value == "true" || value == 1){
			return true;
		}
		return false;

	};

	dust.helpers.in = (chunk, context, bodies, params) => {
		const paramsArray = params.value.split(",");
		if(paramsArray.indexOf(params.key) != -1)
			return true;
		return false;
	};

	// Locals
	res.locals.__ = (ch, con, bo, params) => ch.write(language(lang).__(params.key, params.params));
	res.locals.M_ = (ch, con, bo, params) => ch.write(language(lang).M_(params.key, params.params));

	res.locals.isAdmin = () => {
		if(req.isAuthenticated() && req.session.passport && req.session.passport.user.id_role == 1)
			return true;
		return false;
	};

	res.locals.user_lang = lang;
	res.locals.globalConf = globalConf;
	// Snow and christmas ambiance
	if(moment().format('MM') == '12')
		res.locals.noel = true;

	// Filters
	dust.filters.stringify = value => JSON.stringify(value);

	next();
});

// Overload res.render to always get and reset toastr
app.use((req, res, next) => {
	const render = res.render;
	res.render = (view, locals, cb) => {
		if (typeof locals === "undefined")
			locals = {};
		if (req.session.toastr && req.session.toastr.length > 0) {
			locals.toastr = [];
			for (let i = 0; i < req.session.toastr.length; i++) {
				const toast = req.session.toastr[i];
				const traductedToast = {
					message: language(req.session.lang_user).__(toast.message),
					level: toast.level
				};
				locals.toastr.push(traductedToast);
			}
			req.session.toastr = [];
		}
		locals.dark_theme = req.session.dark_theme ? req.session.dark_theme : false;
		locals.isSupportChatEnabled = globalConf.support_chat_enabled;
		render.call(res, view, locals, cb);
	};
	next();
});

// Routes ======================================================================
require('./routes/')(app);

// Handle 404
app.use((req, res) => {
	res.status(404);
	res.render('common/404');
});

// Launch ======================================================================
models.sequelize.sync({
	logging: false,
	hooks: false
}).then(_ => {
	models.User.findAll().then(users => {
		if (!users || users.length == 0) {
			models.Role.create({
				id: 1,
				name: 'admin',
				version: 1
			}).then(_ => {
				models.Role.create({
					id: 2,
					name: 'user',
					version: 1
				}).then(_ => {
					models.User.create({
						id: 1,
						enabled: 0,
						email: globalConf.env == 'cloud' ? globalConf.sub_domain + '-admin@newmips.com' : 'admin@admin.fr',
						first_name: "admin",
						last_name: "NEWMIPS",
						login: "admin",
						password: null,
						phone: null,
						version: 1
					}).then(user => {
						user.setRole(1);
					})
				})
			})
		}
	});

	if (protocol == 'https') {
		const server = https.createServer(globalConf.ssl, app);
		server.listen(port);
		console.log("Started https on " + port);
	} else {
		app.listen(port);
		console.log("Started on " + port);
	}
}).catch(err => {
	console.log("ERROR - SYNC");
	console.error(err);
});

process.on('SIGINT', _ => {
	process.exit(1);
});

module.exports = app;
