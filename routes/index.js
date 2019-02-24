var express = require('express');
var autentificacion = require('../app/controllers/AutenticacionController');
var passport = require('passport');
var router = express.Router();

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

// PRINCIPAL
/* GET Página Principal */
router.get('/', function (req, res, next) {
    console.log("*************************************IPS********************************")
    function getClientAddress(req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0]
            || req.connection.remoteAddress;
    };

    console.log(getClientAddress(req));
    res.render('index', { titulo: 'Cooperativa Doña Bachita', layout: 'layouts/layout' });
});

// ADMINISTRADOR
/* GET Página Administración */
router.get('/administracion', function (req, res) {
    res.render('administracion/admin', { titulo: 'Administrador', layout: 'layouts/administracion', nombre: req.user.nombre, message: req.flash() });
});
/* GET Página Registro Personal */
router.get('/administracion/verPersonal', Persona.ver);

// INGRESO
/* GET Página Inicio Sesión */
router.get('/ingresar', autentificacion.signin);

/* POST Página Inicio de Sesión */
router.post('/ingresar', passport.authenticate('local-signin', {
    successRedirect: '/administracion',
    failureRedirect: '/ingresar',
    failureFlash: true
}));

// REGISTRO Y VERIFICACION
/* GET Página Registro */
router.get('/registro', autentificacion.signup);

/* POST Página Registro */
router.post('/registro', passport.authenticate('local-signup', {
    successRedirect: '/administracion',
    failureRedirect: '/registro',
    failureFlash: true
}));

/* GET Página Verificacion */
router.get('/verificar', function (req, res) {
    res.render('verificacion/frm-verificacion', { titulo: 'Verificación', layout: 'layouts/layout', message: req.flash() });
});
/* POST Página Verificacion */
router.post('/verificar', verificacionController.guardar);

// SERVICIO AL CLIENTE
/* GET Página Ver Cliente */
router.get('/servicios/verCliente', clienteController.ver);
/* GET Página Registro Cliente */
router.get('/administracion/registroCliente', clienteController.cargarVista);
/* POST Registro Cliente */
router.post('/administracion/registroCliente', clienteController.guardar);

// PERSONAS Y CUENTAS
/* POST Modificar Datos Persona */
router.post('/servicios/modificarPersona', Persona.modificarDatos);
/* POST Modificar Cuenta Persona */
router.post('/servicios/modificarPersonaCuenta', Persona.modificarCuenta);
/* POST Modificar Estado Cuenta Persona */
router.post('/servicios/modificarPersonaEstado', Persona.modificarEstado);

// CAJERO
/*TRANSACCION Pagina Registro Deposito*/
router.get('/cajero/deposito', Transaccion.vistaDeposito);
router.post('/cajero/deposito', Transaccion.guardarRetiro);

/*TRANSACCION Pagina Registro Retiro*/
router.get('/cajero/retiro', Transaccion.vistaRetiro);
router.post('/cajero/retiro', Transaccion.guardarRetiro);

/*TRANSACCION Pagina Registro Transferencia*/
router.get('/cliente/transferencia', Transaccion.vistaTransferencia);
router.post('/cliente/transferencia', Transaccion.guardarTransferencia);

// PAGO EN LINEA
/* GET Página Pago */
router.get('/pago', pagoController.cargarVista);
router.post('/checkout', pagoController.cargarCheckOut);
router.get('/resultado', pagoController.cargarResultado);

module.exports = router;
