'use strict';
var models = require('../models/index');
var Persona = models.persona;
var Rol = models.rol;
var Cuenta = models.cuenta;
var CuentaB = models.cuenta_bancaria;
var Historial = models.historial;
var HistorialPersona = models.historial_persona;
var sequelize = models.sequelize;
var uuid = require('uuid/v4');
var bCrypt = require('bcrypt-nodejs');
var nodemailer = require('../../config/nodemailer/nodemailer');
var moment = require('moment');
var authUser = require('./auth-controller');
var createError = require('http-errors');

class ClienteController {
    cargarCliente(req, res, next) {
        if (authUser(['Servicio al Cliente'], req.user.rol)) {
            res.render('servicioClientes/registroClientes',
                {
                    titulo: 'Registro de Clientes', rol: req.user.auth,
                    layout: 'layouts/administracion', message: req.flash()
                });
        } else {
            return next(createError(401, 'Permiso Denegado.'))
        }
    }

    ver(req, res, next) {
        Cuenta.findAll({
            include: [{
                model: Persona, where: { id_rol: 4 },
                include: [Rol]
            }]
        }).then(function (cliente) {
            if (cliente) {
                if (authUser(['Servicio al Cliente'], req.user.rol)) {
                    res.render('verPersona',
                        {
                            titulo: 'Ver Registro de Clientes',
                            layout: 'layouts/administracion',
                            persona: cliente, rol: req.user.auth,
                            message: req.flash()
                        });
                } else {
                    return next(createError(401, 'Permiso Denegado.'))
                }
            }
        }).catch(err => {
            return next(err);
        });
    }

    guardar(req, res, next) {
        Cuenta.findOne({ where: { usuario: req.body.correo } })
            .then(function (cuenta) {
                if (cuenta) {
                    console.log("**********************************USUARIO YA REGISTRADO**********************************");
                    req.flash('danger', 'El correo que ingresó ya se encuentra registrado.');
                    res.redirect('/servicios/registroCliente');
                } else {
                    return Rol.findOne({ where: { id: 4 } })
                        .then(function (rol) {
                            if (rol) {
                                return sequelize.transaction(function (t) {
                                    var modeloPersona = {
                                        externalId: uuid(),
                                        nombre: req.body.nombre,
                                        apellido: req.body.apellido,
                                        cedula: req.body.cedula,
                                        ciudad: req.body.ciudad,
                                        barrio: req.body.barrio,
                                        callePrincipal: req.body.callePrincipal,
                                        calleSecundaria: req.body.calleSecundaria,
                                        numeroCasa: req.body.numeroCasa,
                                        telefono: req.body.telefono,
                                        email: req.body.correo,
                                        id_rol: rol.id
                                    };
                                    return Persona.create(modeloPersona, { transaction: t })
                                        .then(function (newPersona) {
                                            console.log("**********************************PERSONA CREADA**********************************");
                                            return Historial.findOne({ where: { id: 'cc' } }, { transaction: t })
                                                .then(function (historial) {
                                                    if (historial) {
                                                        var modeloCuenta = {
                                                            externalId: uuid(),
                                                            usuario: newPersona.email,
                                                            clave: ClienteController.generarClave(newPersona.cedula),
                                                            id_persona: newPersona.id
                                                        };
                                                        return Cuenta.create(modeloCuenta, { transaction: t })
                                                            .then(function (newCuenta) {
                                                                console.log("**********************************CUENTA CREADA**********************************");
                                                                var modeloHistorialPersona = {
                                                                    actor_accion: req.user.nombre,
                                                                    lugar_accion: 'LUGAR',
                                                                    fecha_accion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                                                    id_persona: newPersona.id,
                                                                    id_historial: historial.id
                                                                };
                                                                return HistorialPersona.create(modeloHistorialPersona, { transaction: t }).then(function (newHistorial) {
                                                                    console.log("**********************************HISTORIAL CREADO**********************************");
                                                                    var modeloCuentaB = {
                                                                        externalId: uuid(),
                                                                        nro_cuenta: ClienteController.generarNroCuenta(),
                                                                        saldo: 30,
                                                                        id_persona: newPersona.id
                                                                    };

                                                                    var mailOptions = {
                                                                        from: 'CDB',
                                                                        to: newPersona.email,
                                                                        subject: 'Confirmación de Cuenta',
                                                                        html: `<p>Le damos la bienvenida <b>${req.body.nombre} ${req.body.apellido}</b>.<br>`
                                                                            + `Por último se necesita que confirme su cuenta en el siguiente enlace: <br>`
                                                                            + `<a target="_blank" href="http://${req.headers["x-forwarded-host"]}/ingresar">Confirmar Ahora</a></p>`
                                                                    };
                                                                    nodemailer(mailOptions);
                                                                    return CuentaB.create(modeloCuentaB, { transaction: t });
                                                                });
                                                            });
                                                    } else {
                                                        req.flash('warning', 'No se ha podido asignar un historial al cliente.');
                                                        res.redirect('/servicios/registroCliente');
                                                    }
                                                });
                                        });
                                }).then(function (result) {
                                    console.log('**********************************REGISTRO EXITOSO**********************************');
                                    req.flash('success', 'El registro se ha realizado con éxito.');
                                    res.redirect('/servicios/registroCliente');
                                }).catch(function (err) {
                                    console.log('**********************************ERROR EN EL REGISTRO**********************************');
                                    req.flash('danger', (err.errors) ? err.errors[0].message : 'Ocurrió un error inesperado. Vuelva a intentarlo.');
                                    res.redirect('/servicios/registroCliente');
                                });
                            } else {
                                req.flash('warning', 'No se ha podido encontrar el rol.');
                                res.redirect('/servicios/registroCliente');
                            }
                        }).catch(err => {
                            return next(err);
                        });
                }
            }).catch(err => {
                return next(err);
            });
    }

    static generarClave(clave) {
        return bCrypt.hashSync(clave, bCrypt.genSaltSync(8), null);
    }

    static generarNroCuenta() {
        var cod = [0, 3, 9, 8];
        var ext = Math.floor(Math.random() * (10000 - 1000)) + 1000;
        var cd = [];
        var sNumber = ext.toString();
        for (var i = 0, len = sNumber.length; i < len; i += 1) {
            cd.push(+sNumber.charAt(i));
        }
        var j = [];
        for (var i = 1; i < cd.length; i = i + 2) {
            j.push(Math.floor((((cod[i - 1] + cd[i - 1]) / 2) + ((cod[i] + cd[i]) / 2)) / 2));
        }
        var k = cod.concat(cd.concat(j));
        var nroC = k.join('');
        return nroC;
    }

    static busqueda(nro) {
        condicion = false;
        CuentaB.findOne({ where: { nro_cuenta: nro } }).then(cuenta => {
            if (cuenta) {
                condicion = true;
            }
        });
        return condicion;
    }
}
module.exports = ClienteController;