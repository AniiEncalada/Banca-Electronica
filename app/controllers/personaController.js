'use strict';
var models = require('../models/index');
var Persona = models.persona;
var Rol = models.rol;
var Cuenta = models.cuenta;
var Historial = models.historial;
var HistorialPersona = models.historial_persona;
var sequelize = models.sequelize;
var bCrypt = require('bcrypt-nodejs');
var nodemailer = require('../../config/nodemailer/nodemailer');
var moment = require('moment');
var Sequelize = require('sequelize');
const Op = Sequelize.Op;

class PersonaController {
    ver(req, res, next) {
        Cuenta.findAll({ include: [{ model: Persona, where: { [Op.or]: [{ id_rol: 2 }, { id_rol: 3 }] }, include: [Rol] }] }).then(function (personal) {
            if (personal) {
                res.render('verPersona', { titulo: 'Ver Registro de Personal', layout: 'layouts/administracion', message: req.flash(), persona: personal });
            }
        }).catch(err => {
            return next(err);
        });
    }

    modificarDatos(req, res, next) {
        Persona.findOne({ where: { externalId: req.body.external } }).then(function (persona) {
            if (persona) {
                return Historial.findOne({ where: { id: 'md' } }).then(function (historial) {
                    if (historial) {
                        return sequelize.transaction(function (t) {
                            var modeloPersona = {
                                nombre: req.body.nombre,
                                apellido: req.body.apellido,
                                ciudad: req.body.ciudad,
                                barrio: req.body.barrio,
                                callePrincipal: req.body.callePrincipal,
                                calleSecundaria: req.body.calleSecundaria,
                                numeroCasa: req.body.numeroCasa,
                                telefono: req.body.telefono
                            };
                            return Persona.update(modeloPersona, { where: { id: persona.id }, transaction: t }).then(function (newPersona) {
                                var modeloHistorialPersona = {
                                    actor_accion: req.user.nombre,
                                    lugar_accion: req.body.lugar,
                                    fecha_accion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                    id_persona: persona.id,
                                    id_historial: historial.id
                                };
                                return HistorialPersona.create(modeloHistorialPersona, { transaction: t });
                            });
                        }).then(function (result) {
                            console.log('**********************************MODIFICACIÓN EXITOSA**********************************');
                            req.flash('success', 'La modificación se ha realizado con éxito.');
                            if (persona.id_rol == 4) {
                                res.redirect('/servicios/verCliente');
                            } else {
                                res.redirect('/administracion/verPersonal');
                            }
                        }).catch(function (err) {
                            console.log('**********************************ERROR EN LA MODIFICACIÓN**********************************');
                            req.flash('danger', (err.errors) ? err.errors[0].message : 'Ocurrió un error inesperado. Vuelva a intentarlo.');
                            if (persona.id_rol == 4) {
                                res.redirect('/servicios/verCliente');
                            } else {
                                res.redirect('/administracion/verPersonal');
                            }
                        });
                    } else {
                        req.flash('warning', 'No se ha podido encontrar el historial.');
                        if (persona.id_rol == 4) {
                            res.redirect('/servicios/verCliente');
                        } else {
                            res.redirect('/administracion/verPersonal');
                        }
                    }
                }).catch(err => {
                    return next(err);
                });
            } else {
                return next(new Error('No se ha podido encontrar la persona.'));
            }
        }).catch(err => {
            return next(err);
        });
    }

    modificarCuenta(req, res, next) {
        Cuenta.findOne({ where: { externalId: req.body.external }, include: [{ model: Persona }] }).then(function (cuenta) {
            if (cuenta) {
                return Historial.findOne({ where: { id: 'mdc' } }).then(function (historial) {
                    if (historial) {
                        return sequelize.transaction(function (t) {
                            var modeloPersona = {
                                email: req.body.correo
                            };
                            return Persona.update(modeloPersona, { where: { id: cuenta.id_persona }, transaction: t }).then(function (newPersona) {
                                if (req.body.clave) {
                                    var modeloCuenta = {
                                        usuario: req.body.correo,
                                        clave: PersonaController.generarClave(req.body.clave)
                                    };
                                    return Cuenta.update(modeloCuenta, { where: { id: cuenta.id }, transaction: t }).then(function (newCuenta) {
                                        var modeloHistorialPersona = {
                                            actor_accion: req.user.nombre,
                                            lugar_accion: req.body.lugar,
                                            fecha_accion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                            id_persona: cuenta.id_persona,
                                            id_historial: historial.id
                                        };
                                        return HistorialPersona.create(modeloHistorialPersona, { transaction: t });
                                    });
                                } else {
                                    var modeloCuenta = {
                                        usuario: req.body.correo
                                    };
                                    return Cuenta.update(modeloCuenta, { where: { id: cuenta.id }, transaction: t }).then(function (newCuenta) {
                                        var modeloHistorialPersona = {
                                            actor_accion: req.user.nombre,
                                            lugar_accion: req.body.lugar,
                                            fecha_accion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                            id_persona: cuenta.id_persona,
                                            id_historial: historial.id
                                        };
                                        return HistorialPersona.create(modeloHistorialPersona, { transaction: t });
                                    });
                                }
                            });
                        }).then(function (result) {
                            console.log('**********************************MODIFICACIÓN EXITOSA**********************************');
                            req.flash('success', 'La modificación se ha realizado con éxito.');
                            if (cuenta.persona.id_rol == 4) {
                                res.redirect('/servicios/verCliente');
                            } else {
                                res.redirect('/administracion/verPersonal');
                            }
                        }).catch(function (err) {
                            console.log('**********************************ERROR EN LA MODIFICACIÓN**********************************');
                            req.flash('danger', (err.errors) ? err.errors[0].message : 'Ocurrió un error inesperado. Vuelva a intentarlo.');
                            if (cuenta.persona.id_rol == 4) {
                                res.redirect('/servicios/verCliente');
                            } else {
                                res.redirect('/administracion/verPersonal');
                            }
                        });
                    } else {
                        req.flash('warning', 'No se ha podido encontrar el historial.');
                        if (cuenta.persona.id_rol == 4) {
                            res.redirect('/servicios/verCliente');
                        } else {
                            res.redirect('/administracion/verPersonal');
                        }
                    }
                }).catch(err => {
                    return next(err);
                });
            } else {
                return next(new Error('No se ha podido encontrar la cuenta'));
            }
        }).catch(err => {
            return next(err);
        });
    }

    modificarEstado(req, res, next) {
        Cuenta.findOne({ where: { externalId: req.body.external }, include: [{ model: Persona }] }).then(function (cuenta) {
            if (cuenta) {
                if (cuenta.persona.id_formulario != null) {
                    return Historial.findOne({ where: { id: 'mec' } }).then(function (historial) {
                        if (historial) {
                            return sequelize.transaction(function (t) {
                                var modeloCuenta = {
                                    estado: req.body.estado
                                };
                                return Cuenta.update(modeloCuenta, { where: { id: cuenta.id }, transaction: t }).then(function (newCuenta) {
                                    var modeloHistorialPersona = {
                                        actor_accion: req.user.nombre,
                                        lugar_accion: req.body.lugar,
                                        fecha_accion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                        id_persona: cuenta.id_persona,
                                        id_historial: historial.id
                                    };
                                    return HistorialPersona.create(modeloHistorialPersona, { transaction: t });
                                });
                            }).then(function (result) {
                                console.log('**********************************MODIFICACIÓN EXITOSA**********************************');
                                req.flash('success', 'La modificación se ha realizado con éxito.');
                                if (cuenta.persona.id_rol == 4) {
                                    res.redirect('/servicios/verCliente');
                                } else {
                                    res.redirect('/administracion/verPersonal');
                                }
                            }).catch(function (err) {
                                console.log('**********************************ERROR EN LA MODIFICACIÓN**********************************');
                                req.flash('danger', (err.errors) ? err.errors[0].message : 'Ocurrió un error inesperado. Vuelva a intentarlo.');
                                if (cuenta.persona.id_rol == 4) {
                                    res.redirect('/servicios/verCliente');
                                } else {
                                    res.redirect('/administracion/verPersonal');
                                }
                            });
                        } else {
                            req.flash('warning', 'No se ha podido encontrar el historial.');
                            if (cuenta.persona.id_rol == 4) {
                                res.redirect('/servicios/verCliente');
                            } else {
                                res.redirect('/administracion/verPersonal');
                            }
                        }
                    }).catch(err => {
                        return next(err);
                    });
                } else {
                    req.flash('warning', 'No se ha podido actualizar el estado de la cuenta porque aún no se ha realizado la verificación.');
                    if (cuenta.persona.id_rol == 4) {
                        res.redirect('/servicios/verCliente');
                    } else {
                        res.redirect('/administracion/verPersonal');
                    }
                }
            } else {
                return next(new Error('No se ha podido encontrar la cuenta'));
            }
        }).catch(err => {
            return next(err);
        });
    }

    static generarClave(clave) {
        return bCrypt.hashSync(clave, bCrypt.genSaltSync(8), null);
    }
}
module.exports = PersonaController;