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
var language = require('./services/language');
var extend = require('util')._extend;
var https = require('https');
var fs = require('fs');
var helper = require('./utils/helpers');
var logger = require('./utils/logger');
var split = require('split');
var AnsiToHTML = require('ansi-to-html');
var ansiToHtml = new AnsiToHTML();
var moment = require('moment');
var models = require('./models/');

// Passport for configuration
require('./utils/authStrategies');

// set up our express application
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

var allLogStream = fs.createWriteStream(path.join(__dirname, 'all.log'), {
    flags: 'a'
});

app.use(morgan('dev', {
    skip: function(req, res) {
        // Empeche l'apparition de certain log polluant.
        var skipArray = ["/update_logs", "/get_pourcent_generation", "/status", "/completion", "/"];
        var currentURL = req.url;
        if (currentURL.indexOf("?") != -1) {
            // Remove params from URL
            currentURL = currentURL.split("?")[0];
        }
        if (skipArray.indexOf(currentURL) != -1) {
            return true;
        }
    },
    stream: split().on('data', function(line) {
        if (allLogStream.bytesWritten < 5000) {
            allLogStream.write(moment().format("YY-MM-DD HH:mm:ss") + ": " + ansiToHtml.toHtml(line) + "\n");
            process.stdout.write(line + "\n");
        } else {
            /* Clear all.log if too much bytes are written */
            fs.writeFileSync(path.join(__dirname, 'all.log'), '');
            allLogStream.bytesWritten = 0;
        }
    })
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
}));
app.use(bodyParser.json({
    limit: '50mb'
}));

// Template rendering
//------------------------------ DUST.JS ------------------------------ //
var dust = require('dustjs-linkedin');
var cons = require('consolidate');

app.set('views', path.join(__dirname, 'views'));
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

app.use(session({
    store: sessionStore,
    cookieName: 'newmipsCookie',
    secret: 'newmipsmakeyourlifebetter',
    resave: true,
    saveUninitialized: false,
    maxAge: 360 * 5,
    key: 'newmipsCookie'
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Locals ======================================================================
app.locals.moment = require('moment');

app.use(function(req, res, next) {
    // Applications created with newmips only have fr-FR.
    // To avoid cookie conflict between newmips and this app, set fr-FR by default
    var lang = 'fr-FR';
    if (req.isAuthenticated()) {
        if (req.session.lang_user)
            lang = req.session.lang_user;
        else
            req.session.lang_user = lang;
    }

    res.locals.user_lang = lang;
    // Create dust helper
    dust.helpers.__ = function(ch, con, bo, params) {
        return language(lang).__(params.key, params.params);
    }
    dust.helpers.M_ = function(ch, con, bo, params) {
        return language(lang).M_(params.key, params.params);
    }
    dust.helpers.ifTrue = function(chunk, context, bodies, params) {
        var value = params.key;

        if(value == true || value == "true" || value == 1){
            return true;
        } else{
            return false;
        }
    }
    dust.helpers.in = function(chunk, context, bodies, params) {
        let paramsArray = params.value.split(",");
        if(paramsArray.indexOf(params.key) != -1)
            return true;
        else
            return false;
    }
    dust.filters.stringify = function(value) {
        return JSON.stringify(value);
    };
    dust.filters.parse = function(value) {
        return JSON.parse(value);
    };

    res.locals.globalConf = globalConf;
    next();
});

// Overload res.render to always get and reset toastr
app.use(function(req, res, next) {
    var render = res.render;
    res.render = function(view, locals, cb) {
        if (typeof locals === "undefined")
            locals = {};
        if (req.session.toastr && req.session.toastr.length > 0) {
            locals.toastr = [];
            for (var i = 0; i < req.session.toastr.length; i++) {
                var toast = req.session.toastr[i];
                var traductedToast = {
                    message: language(req.session.lang_user).__(toast.message),
                    level: toast.level
                };
                locals.toastr.push(traductedToast);
            }
            req.session.toastr = [];
        }
        if (locals.isSlackChatEnabled = globalConf.slack_chat_enabled) {
            var slackConf = require('./config/slack');
            locals.slackApiToken = slackConf.SLACK_API_TOKEN;
        }
        render.call(res, view, locals, cb);
    };
    next();
});

// Routes ======================================================================
require('./routes/')(app);

// Handle 404
app.use(function(req, res) {
    res.status(404);
    res.render('common/404');
});

// Launch ======================================================================

models.sequelize.sync({
    logging: false,
    hooks: false
}).then(function() {
    models.User.findAll().then(function(users) {
        if (!users || users.length == 0) {
            models.Role.create({
                id: 1,
                name: 'admin',
                version: 1
            }).then(function() {
                models.Role.create({
                    id: 2,
                    name: 'user',
                    version: 1
                }).then(function() {
                    models.User.create({
                        id: 1,
                        email: null,
                        enabled: 0,
                        first_name: "admin",
                        last_name: "NEWMIPS",
                        login: "admin",
                        password: null,
                        phone: null,
                        version: 1
                    }).then(function(user) {
                        user.setRole(1);
                    })
                })
            })
        }
    })
    if (protocol == 'https') {
        var server = https.createServer(globalConf.ssl, app);
        server.listen(port);
        console.log("Started https on " + port);
    } else {

        app.listen(port);
        console.log("Started on " + port);
    }
}).catch(function(err) {
    console.log("ERROR - SYNC");
    logger.silly(err);
    console.log(err);
});

module.exports = app;