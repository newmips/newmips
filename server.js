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
var extend = require('util')._extend;
var https = require('https');
var fs = require('fs');
var helper = require('./utils/helpers');
var logger = require('./utils/logger');

// configuration ===============================================================

// pass passport for configuration
require('./utils/authStrategies');

// set up our express application
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

// Empeche l'apparition de certain log polluant.
app.use(morgan('dev', {
	skip: function (req, res) {
		// < 400 permet d'afficher que les erreurs dans les logs
		//return res.statusCode < 400
		return req.url == "/get_pourcent_generation"
	}
}));

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); // set up jade for templating

// required for passport
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
	cookieName: 'newmipsCookie',
	secret: 'newmipsmakeyourlifebetter',
	resave: true,
	saveUninitialized: true,
	maxAge: 360*5,
	key: 'newmipsCookie'
 } )); // session secret
 app.use(passport.initialize());
 app.use(passport.session()); // persistent login sessions
 app.use(flash()); // use connect-flash for flash messages stored in session

// Locals ======================================================================
app.locals.moment = require('moment');

// Language ======================================================================
app.use(function(req, res, next) {
	// Applications created with newmips only have fr-FR.
	// To avoid cookie conflict between newmips and this app, set fr-FR by default
	var lang = 'fr-FR';
	if (req.session.lang_user)
        lang = req.session.lang_user;
    else
    	req.session.lang_user = lang;
	// Pass translate function to jade templates
	res.locals = extend(res.locals, language(lang));
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
        helper.getNbInstruction(function(totalInstruction){
        	// Get nbInstruction
            locals.cptInstruction = totalInstruction;
            // Get limit instruction
            //locals.limitInstruction = globalConf.limitInstruction;
            // Pourcent for progress bar
            locals.pourcentInstruction = (locals.cptInstruction*100)/300;
			render.call(res, view, locals, cb);
		});
    };
    next();
});

// routes =======================================================================
app.use('/', require('./routes/routes.js'));
app.use('/module', require('./routes/module'));
app.use('/data_entity', require('./routes/data_entity'));
app.use('/data_field', require('./routes/data_field'));
app.use('/default', require('./routes/default'));
app.use('/application', require('./routes/application'));
app.use('/live', require('./routes/live'));
app.use('/settings', require('./routes/settings'));
app.use('/user', require('./routes/user'));
app.use('/instruction_script', require('./routes/instruction_script'));
app.use('/import', require('./routes/import'));
app.use('/editor', require('./routes/editor'));

// launch ======================================================================
if (protocol == 'https') {
	var server = https.createServer(globalConf.ssl, app);
	server.listen(port);
	console.log("Started https on "+port);
}
else {
	app.listen(port);
	console.log("Started on "+port);
}

module.exports = app;
