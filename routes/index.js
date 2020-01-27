var express = require('express');
var autentificacion = require('../app/controllers/AutenticacionController');
var passport = require('passport');
var router = express.Router();
var createError = require('http-errors');

var persona = require('../app/controllers/personaController');
var Persona = new persona();
var cliente = require('../app/controllers/clientesController');
var clienteController = new cliente();
var transaccion = require('../app/controllers/transaccionController');
var Transaccion = new transaccion();
var verificacion = require('../app/controllers/verificacion-controller');
var verificacionController = new verificacion();
var pago = require('../app/controllers/pago-controller');
var pagoController = new pago();
var authUser = require('../app/controllers/auth-controller');

// Middleware de Autenticación
var auth = function middleware(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.estado == false) {
            req.flash('danger', 'Se necesita primeramente que se verifique su cuenta.');
            res.redirect('/verificar');
        } else
            next();
    } else {
        req.flash('danger', 'Se necesita primeramente iniciar sesión.');
        res.redirect('/ingresar');
    }
};

// PRINCIPAL
/* GET Página Principal */
router.get('/', function (req, res, next) {
    res.render('index', {
        titulo: 'Cooperativa Doña Bachita',
        layout: 'layouts/layout'
    });
});

// CLIENTE
/* GET Página Cliente */
router.get('/cliente', auth, clienteController.principal);

// ADMINISTRADOR
/* GET Página Administración */
router.get('/administracion', auth, function (req, res, next) {
    if (authUser(['Administrador', 'Servicio al Cliente', 'Cajero'], req.user.rol)) {
        res.render('administracion/admin', {
            titulo: 'Administrador', layout: 'layouts/administracion',
            nombre: req.user.nombre, rol: req.user.auth, message: req.flash()
        });
    } else {
        res.redirect('/cliente');
    }
});
/* GET Página Registro Personal */
router.get('/administracion/verPersonal', auth, Persona.ver);

// INGRESO
/* GET Página Inicio Sesión */
router.get('/ingresar', autentificacion.signin);

/* POST Página Inicio de Sesión */
router.post('/ingresar', function (req, res, next) {
    passport.authenticate('local-signin',
        function (err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.redirect('/ingresar'); }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                if (!user.estado) { return res.redirect('/verificar') }
                return res.redirect('/administracion');
            });
        })(req, res, next);
})

// REGISTRO Y VERIFICACION
/* GET Página Registro */
router.get('/registro', auth, autentificacion.signup);

/* POST Página Registro */
router.post('/registro', auth, passport.authenticate('local-signup', {
    successRedirect: '/administracion',
    failureRedirect: '/registro',
    failureFlash: true
}));

/* GET Página Verificacion */
router.get('/verificar', function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.estado) {
            req.flash('success', 'Su cuenta ya está verificada.');
            res.redirect('/administracion');
        } else
            res.render('verificacion/frm-verificacion', {
                titulo: 'Verificación',
                layout: 'layouts/layout', message: req.flash()
            });
    } else {
        req.flash('danger', 'Se necesita primeramente iniciar sesión.');
        res.redirect('/ingresar');
    }
});
/* POST Página Verificacion */
router.post('/verificar', verificacionController.guardar);

//SERVICIO AL CLIENTE
/* GET Página listado Cliente */
router.get('/servicios/verCliente', auth, clienteController.ver);
router.get('/servicios/registroCliente', auth, clienteController.cargarCliente);
/* POST Página Registro Cliente */
router.post('/servicios/registroCliente', auth, clienteController.guardar);

// PERSONAS Y CUENTAS
/* POST Modificar Datos Persona */
router.post('/servicios/modificarPersona', auth, Persona.modificarDatos);
/* POST Modificar Cuenta Persona */
router.post('/servicios/modificarPersonaCuenta', auth, Persona.modificarCuenta);
/* POST Modificar Estado Cuenta Persona */
router.post('/servicios/modificarPersonaEstado', auth, Persona.modificarEstado);

// CAJERO
/*TRANSACCION Pagina Registro Deposito*/
router.get('/cajero/deposito', auth, Transaccion.vistaDeposito);
router.post('/cajero/deposito', auth, Transaccion.guardarDeposito);

/*TRANSACCION Pagina Registro Retiro*/
router.get('/cajero/retiro', auth, Transaccion.vistaRetiro);
router.post('/cajero/retiro', auth, Transaccion.guardarRetiro);

/*TRANSACCION Pagina Registro Transferencia*/
router.get('/cliente/transferencia', auth, Transaccion.vistaTransferencia);
router.post('/cliente/transferencia', auth, Transaccion.guardarTransferencia);

/**Ver listado de transacciones */
router.get('/servicios/verTransaccion', auth, Transaccion.buscar);
router.post('/servicios/transaccionCedula', auth, Transaccion.transaccionCedula);
router.post('/servicios/transaccionNumero', auth, Transaccion.transaccionNumero);
router.post('/servicios/transaccionAcreditar', auth, Transaccion.transaccionAcreditar);
router.post('/servicios/transaccionDebitar', auth, Transaccion.transaccionDebitar);

//Prueba
// router.get('/prueba', Transaccion.listar);

// PAGO EN LINEA
/* GET Página Pago */
router.get('/pago', auth, pagoController.cargarVista);
router.post('/checkout', auth, pagoController.cargarCheckOut);
router.get('/resultado', auth, pagoController.cargarResultado);

// CERRAR SESION
router.get('/salir', autentificacion.logout);

module.exports = router;
