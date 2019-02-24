'use strict';
var models = require('../models/index');
var CuentaB = models.cuenta_bancaria;
var Movimiento = models.movimiento;
var Transaccion = models.transaccion;
var sequelize = models.sequelize;
var Localizacion = models.localizacion;
var Persona = models.persona;
var pdf = require('html-pdf');
var moment = require('moment');

class transaccionController {
    //Cargar vista para deposito
    vistaDeposito(req, res) {
        console.log(res.locals);
        res.render('transferencias/deposito', { titulo: 'Depositos', layout: 'layouts/administracion', message: req.flash() });
    }
    //Cargar vista para retiro
    vistaRetiro(req, res) {
        res.render('transferencias/retiro', { titulo: 'Retiros', layout: 'layouts/administracion', message: req.flash() });
    }
    //Cargar vista para movimiento
    vistaTransferencia(req, res) {
        res.render('transferencias/transferencia', { titulo: 'Transferencias', layout: 'layouts/administracion', message: req.flash() });
    }

    //Listar transacciones por cedula
    transaccionCedula(req, res, next) {
        var ced = '123456789';
        Persona.findOne({ where: { cedula: req.body.cedula, id_rol: 4 } }).then(persona => {
            if (persona) {
                CuentaB.findOne({ where: { id_persona: persona.id, estado_cuenta: true } }).then(cuentaB => {
                    if (cuentaB) {
                        Transaccion.findAll({ where: { id_cuenta_bancaria: cuentaB.id }, include: [{ model: Movimiento }, { model: Localizacion }, { model: CuentaB, include: [{ model: Persona }] }] }).then(transaccion => {
                            if (transaccion) {
                                res.render('transferencias/verTransacciones', { titulo: 'Lista de Transacciones', layout: 'layouts/administracion', message: req.flash(), transaccion: transaccion });
                            } else {
                                req.flash('danger', 'La cuenta no registra transacciones.');
                                res.redirect('/administracion');
                            }

                        }).catch(err => {
                            return next(err);
                        });
                    } else {
                        req.flash('danger', 'La cuenta no se ha encontrado, pude que este inactiva.');
                        res.redirect('/administracion');
                    }
                }).catch(err => {
                    return next(err);
                });
            } else {
                req.flash('danger', 'No se han encontrado clientes con ese número de cedula.');
                res.redirect('/administracion');
            }
        }).catch(err => {
            return next(err);
        });

    }

    //DEPOSITO
    guardarDeposito(req, res, next) {
        console.log(JSON.stringify(req.body.pais));
        CuentaB.findOne({ where: { nro_cuenta: req.body.nro }, include: [{ model: Persona }] }).then(function (cuentaB) {
            if (cuentaB) {
                return Movimiento.findOne({ where: { id: 1 } }).then(function (movimiento) {
                    if (movimiento) {
                        return sequelize.transaction(function (t) {
                            console.log("***********************************************************************************");
                            console.log(JSON.stringify(req.body));
                            var modeloLocalizacion = {
                                ciudad: req.body.ciudad,
                                pais: req.body.pais,
                                latitud: req.body.latitud,
                                longitud: req.body.longitud,
                                ip: req.body.ip,
                                provincia: req.body.provincia
                            };
                            return Localizacion.create(modeloLocalizacion, { transaction: t }).then(function (newLocalizacion) {
                                var modeloTransaccion = {
                                    valor: req.body.valor * 1,
                                    nro_cuenta: req.body.nro,
                                    fecha_transaccion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                    id_movimiento: movimiento.id,
                                    id_cuenta_bancaria: cuentaB.id,
                                    id_localizacion: newLocalizacion.id
                                };
                                return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                    return CuentaB.update({ saldo: (cuentaB.saldo + newTransaccion.valor) },
                                        { where: { id: newTransaccion.id_cuenta_bancaria }, transaction: t });
                                });
                            });
                        }).then(function (result) {
                            console.log("promesa**************************");
                            req.flash('success', 'El deposito se ha realizado con exito.');
                            res.redirect('/administracion');
                        }).catch(function (err) {
                            console.log("captura error**************************");
                            console.log(JSON.stringify(err));
                            req.flash('danger', 'No se puedo realizar la accion.');
                            res.redirect('/cajero/deposito');
                        });
                    } else {
                        req.flash('danger', 'Error.');
                        res.redirect('/administracion');
                    }
                }).catch(err => {
                    return next(err);
                });
            } else {
                req.flash('danger', 'Saldo insuficiente');
                res.redirect('/administracion');
            }

        }).catch(err => {
            return next(err);
        });

    }
    //DEPOSITO END

    //RETIRO start
    guardarRetiro(req, res, next) {
        CuentaB.findOne({ where: { nro_cuenta: req.body.nro } }).then(function (cuentaB) {
            if (cuentaB) {
                if (cuentaB.saldo >= req.body.valor) {
                    return Movimiento.findOne({ where: { id: 2 } }).then(async function (movimiento) {
                        if (movimiento) {
                            return sequelize.transaction(function (t) {
                                return sequelize.transaction(function (t) {

                                    var modeloLocalizacion = {

                                        ciudad: req.body.ciudad,
                                        pais: req.body.pais,
                                        latitud: req.body.latitud,
                                        longitud: req.body.longitud,
                                        ip: req.body.ip,
                                        provincia: req.body.provincia
                                    };
                                    return Localizacion.create(modeloLocalizacion, { transaction: t }).then(function (newLocalizacion) {
                                        var modeloTransaccion = {
                                            valor: req.body.valor,
                                            nro_cuenta: req.body.nro * 1,
                                            fecha_transaccion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                            id_movimiento: movimiento.id,
                                            id_cuenta_bancaria: cuentaB.id,
                                            id_localizacion: newLocalizacion.id
                                        };
                                        return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                            return CuentaB.update({ saldo: (cuentaB.saldo - newTransaccion.valor) },
                                                { where: { id: newTransaccion.id_cuenta_bancaria }, transaction: t });
                                        });
                                    });

                                });
                            }).then(function (result) {
                                console.log("promesa**************************");
                                req.flash('success', 'El Retiro se ha realizado con exito.');
                                res.redirect('/administracion');
                            }).catch(function (err) {
                                console.log("captura error**************************");
                                console.log(JSON.stringify(err));
                                req.flash('danger', 'No se puedo realizar la accion.');
                                res.redirect('/cajero/deposito');
                            });
                        } else {
                            req.flash('danger', 'Error.');
                            res.redirect('/administracion');
                        }
                    }).catch(err => {
                        return next(err);
                    });
                } else {
                    req.flash('danger', 'Saldo insuficiente');
                    res.redirect('/administracion');
                }
            } else {
                req.flash('danger', 'La cuenta no ha sido encontrada, por favor revise el numero de cuenta.');
                res.redirect('/administracion');
            }
        }).catch(err => {
            return next(err);
        });

    }
    //RETIRO END

    //Paso de una cuenta a otra
    guardarTransferencia(req, res, next) {
        console.log(JSON.stringify(req.body));
        CuentaB.findOne({ where: { nro_cuenta: req.body.nro } }).then(function (cuentaB) {
            if (cuentaB) {
                CuentaB.findOne({ where: { id_persona: req.user.persona } }).then(function (cuenta) {
                    console.log(req.user.persona);
                    if (cuenta) {
                        if (cuenta.saldo >= req.body.valor) {
                            return Movimiento.findOne({ where: { id: 2 } }).then(async function (movimiento) {
                                if (movimiento) {
                                    return sequelize.transaction(function (t) {
                                        var modeloLocalizacion = {
                                            ciudad: req.body.ciudad,
                                            pais: req.body.pais,
                                            latitud: req.body.latitud,
                                            longitud: req.body.longitud,
                                            ip: req.body.ip,
                                            provincia: req.body.provincia
                                        };
                                        return Localizacion.create(modeloLocalizacion, { transaction: t }).then(function (newLocalizacion) {
                                            var modeloTransaccion = {
                                                valor: req.body.valor * 1,
                                                nro_cuenta: req.body.nro,
                                                fecha_transaccion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                                id_movimiento: movimiento.id,
                                                id_cuenta_bancaria: cuentaB.id,
                                                id_localizacion: newLocalizacion.id
                                            };
                                            return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                                return CuentaB.update({ saldo: (cuentaB.saldo + newTransaccion.valor) },
                                                    { where: { id: newTransaccion.id_cuenta_bancaria }, transaction: t }).then(function (cuentaAcreditada) {
                                                        return Movimiento.findOne({ where: { id: 1 } }).then(function (movimiento2) {
                                                            if (movimiento2) {
                                                                var modeloTransaccion2 = {
                                                                    valor: req.body.valor * 1,
                                                                    nro_cuenta: cuenta.nro_cuenta,
                                                                    fecha_transaccion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                                                    id_movimiento: movimiento2.id,
                                                                    id_cuenta_bancaria: cuenta.id,
                                                                    id_localizacion: newLocalizacion.id
                                                                };
                                                                return Transaccion.create(modeloTransaccion2, { transaction: t }).then(function (newTransaccion2) {
                                                                    return CuentaB.update({ saldo: (cuenta.saldo - newTransaccion2.valor) },
                                                                        { where: { id: newTransaccion2.id_cuenta_bancaria }, transaction: t });
                                                                });
                                                            }
                                                        });
                                                    });
                                            });
                                        });
                                    }).then(function (result) {
                                        console.log("promesa**************************");
                                        req.flash('success', 'La transferencia se ha realizado con exito.');
                                        res.redirect('/administracion');
                                    }).catch(function (err) {
                                        console.log("captura error**************************");
                                        console.log(JSON.stringify(err));
                                        req.flash('danger', 'No se puedo realizar la accion.');
                                        res.redirect('/cliente/transferencia');
                                    });
                                } else {
                                    req.flash('danger', 'Error.');
                                    res.redirect('/administracion');
                                }
                            }).catch(err => {
                                return next(err);
                            });
                        } else {
                            req.flash('danger', 'Saldo insuficiente');
                            res.redirect('/administracion');
                        }
                    } else {
                        req.flash('danger', 'Cuenta no encontrada');
                        res.redirect('/administracion');
                    }
                });

            } else {
                req.flash('danger', 'La cuenta no se ha encontrado, por favor revise el numero y vuelva a intenta');
                res.redirect('/administracion');
            }

        }).catch(err => {
            return next(err);
        });

    }
    //movimiento end

}

module.exports = transaccionController;