var exports = module.exports = {};

exports.signup = function (req, res) {
    res.render('administracion/register', { titulo: 'Cooperativa Doña Bachita | Registrar Personal', layout: 'layouts/signup', message: req.flash() });
};

exports.signin = function (req, res) {
    res.render('ingreso', { titulo: 'Cooperativa Doña Bachita | Ingresar', layout: 'layouts/layout', message: req.flash() });
};

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
};