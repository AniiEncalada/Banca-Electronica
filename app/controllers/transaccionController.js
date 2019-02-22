'use strict';
var models = require('../models/index');
var CuentaB = models.cuenta_bancaria;
var Movimiento = models.movimiento;
var Transaccion = models.transaccion;
var sequelize = models.sequelize;
class transaccionController {
    //Cargar vista para deposito
    vistaDeposito(req, res) {
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

    //DEPOSITO
    guardarDeposito(req, res, next) {
        CuentaB.findOne({ where: { nro_cuenta: req.body.nro } }).then(function (cuentaB) {
            if (cuentaB) {
                return Movimiento.findOne({ where: { id: 2 } }).then(async function (movimiento) {
                    if (movimiento) {
                        return sequelize.transaction(function (t) {
                            var modeloTransaccion = {
                                valor: req.body.valor,
                                nro_cuenta: req.body.nro,
                                lugar: req.ip,
                                // fecha_transaccion: ,
                                id_movimiento: movimiento.id,
                                id_cuenta_bancaria: cuentaB.id
                            };
                            return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                return CuentaB.update({ saldo: (cuentaB.saldo + newTransaccion.valor) },
                                    { where: { id: newTransaccion.id_cuenta_bancaria } }, { transaction: t });
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
                                var modeloTransaccion = {
                                    valor: req.body.valor,
                                    nro_cuenta: req.body.nro,
                                    lugar: req.ip,
                                    id_movimiento: movimiento.id,
                                    id_cuenta_bancaria: cuentaB.id
                                };
                                return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                    return CuentaB.update({ saldo: (cuentaB.saldo - newTransaccion.valor) },
                                        { where: { id: newTransaccion.id_cuenta_bancaria } }, { transaction: t });
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
        CuentaB.findOne({ where: { nro_cuenta: req.body.nro } }).then(function (cuentaB) {
            if (cuentaB) {
                CuentaB.findOne({ where: { id_persona: req.user.persona } }).then(function (cuenta) {
                    if (cuenta) {
                        if (cuenta.saldo >= req, body.valor) {
                            return Movimiento.findOne({ where: { id: 2 } }).then(async function (movimiento) {
                                if (movimiento) {
                                    return sequelize.transaction(function (t) {
                                        var modeloTransaccion = {
                                            valor: req.body.valor,
                                            nro_cuenta: req.body.nro,
                                            lugar: req.ip,
                                            id_movimiento: movimiento.id,
                                            id_cuenta_bancaria: cuentaB.id
                                        };
                                        return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                            return CuentaB.update({ saldo: (cuentaB.saldo - newTransaccion.valor) },
                                                { where: { id: newTransaccion.id_cuenta_bancaria } }, { transaction: t }).then(function (cuentaAcreditada) {
                                                    Movimiento.findOne({ where: { id: 1 } }).then(function (movimiento2) {
                                                        if (movimiento2) {
                                                            var modeloTransaccion2 = {
                                                                valor: req.body.valor,
                                                                nro_cuenta: req.body.nro,
                                                                lugar: req.ip,
                                                                id_movimiento: movimiento2.id,
                                                                id_cuenta_bancaria: cuenta.id
                                                            };
                                                            return Transaccion.create(modeloTransaccion2, { transaccion: t }).then(function (newTransaccion2) {
                                                                return CuentaB.update({ saldo: (cuenta.saldo - newTransaccion2) },
                                                                    { where: { id: newTransaccion2.id_cuenta_bancaria } }, { transaccion: t });
                                                            });
                                                        }
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