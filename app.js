
'use strict';
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');

var app = express();

// bodyParser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'app', 'views'));
app.set('view engine', 'hbs');

// session setup
app.use(session({secret: "cdb", resave: true, saveUninitialized: true}));
app.use(flash(app));
app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// models sequelize setup
var models = require('./app/models');
models.sequelize.sync().then(() => {
    console.log("Se ha conectado a la base de Datos");
}).catch(err => {
    console.log(err, "Ocurrió un error");
});
require('./config/pasaporte/passport')(passport, models.cuenta, models.persona, models.rol, models.historial, models.historial_persona, models.sequelize);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404, 'Página no encontrada.'));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error', {titulo: err.message, layout: 'layouts/layout'});
});

module.exports = app;
