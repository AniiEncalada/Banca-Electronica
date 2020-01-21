var exports = module.exports = {};
var authUser = require('./auth-controller');
var createError = require('http-errors');

exports.signup = function (req, res, next) {
    if (authUser(['Administrador'], req.user.rol)) {
        res.render('administracion/register', {
            titulo: 'Cooperativa Doña Bachita | Registrar Personal',
            layout: 'layouts/administracion',
            rol: req.user.auth, message: req.flash()
        });
    } else {
        return next(createError(401, 'Permiso Denegado.'))
    }
};

exports.signin = function (req, res) {
    if (req.isAuthenticated()) {
        if (authUser(['Administrador', 'Servicio al Cliente', 'Cajero'], req.user.rol)) {
            res.redirect('/administracion');
        } else {
            res.redirect('/cliente');
        }
    } else {
        res.render('ingreso', {
            titulo: 'Cooperativa Doña Bachita | Ingresar',
            layout: 'layouts/layout', message: req.flash()
        });
    }
};

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/ingresar');
    });
};