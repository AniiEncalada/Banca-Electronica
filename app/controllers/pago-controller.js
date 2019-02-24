'use strict'
var models = require('../models/index');
var CuentaB = models.cuenta_bancaria;
var Transaccion = models.transaccion;
var Movimiento = models.movimiento;
var Historial = models.historial;
var HistorialPersona = models.historial_persona;
var https = require('https');
var querystring = require('querystring');
var sequelize = models.sequelize;
var moment = require('moment');

class pagoController {
    cargarVista(req, res, next) {
        res.render('pago/pago', { titulo: 'Pagos en Linea', layout: 'layouts/administracion', message: req.flash() });
    }

    cargarCheckOut(req, res, next) {
        CuentaB.findOne({ where: { id_persona: req.user.persona } }).then(function (cuentaB) {
            if (cuentaB) {
                if (cuentaB.saldo >= req.body.monto) {
                    pagoController.request(req.body.monto, function (response) {
                        if (response) {
                            console.log(response);
                            if (/^(000\.200)/.test(response.result.code)) {
                                res.render('pago/checkout', {
                                    titulo: 'CheckOut', layout: 'layouts/administracion', variable: response.id, message: req.flash()
                                });
                            } else {
                                req.flash('warning', 'Lo sentimos, Ocurrió un error al obtener el CheckOut.');
                                res.redirect('/pago');
                            }
                        } else {
                            req.flash('warning', 'Lo sentimos, existió en error durante la transacción.');
                            res.redirect('/pago');
                        }
                    });
                } else {
                    req.flash('warning', 'Lo sentimos, su saldo actual es insuficiente.');
                    res.redirect('/pago');
                }
            } else {
                req.flash('warning', 'Lo sentimos, sus datos no han sido encontrados.');
                res.redirect('/pago');
            }
        }).catch(err => {
            return next(err);
        });
    }

    cargarResultado(req, res, next) {
        pagoController.result(req.query.id, function (response) {
            console.log(response);
            if (/^(000\.000\.|000\.100\.1|000\.[36])/.test(response.result.code)) {
                CuentaB.findOne({ where: { id_persona: req.user.persona } }).then(function (cuentaB) {
                    if (cuentaB) {
                        return Movimiento.findOne({ where: { id: 2 } }).then(function (movimiento) {
                            if (movimiento) {
                                return Historial.findOne({ where: { id: 'pl' } }).then(function (historial) {
                                    if (historial) {
                                        return sequelize.transaction(function (t) {
                                            var modeloTransaccion = {
                                                valor: response.amount,
                                                nro_cuenta: cuentaB.nro_cuenta,
                                                fecha_transaccion: new Date(),
                                                id_cuenta_bancaria: cuentaB.id,
                                                id_movimiento: movimiento.id
                                            };
                                            return Transaccion.create(modeloTransaccion, { transaction: t }).then(function (newTransaccion) {
                                                var modeloHistorial = {
                                                    actor_accion: req.user.nombre,
                                                    lugar_accion: 'Lugar',
                                                    fecha_accion: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                                                    id_persona: cuentaB.id_persona,
                                                    id_historial: historial.id
                                                };
                                                return HistorialPersona.create(modeloHistorial, { transaction: t }).then(function (newHistorial) {
                                                    return CuentaB.update({ saldo: (cuentaB.saldo - newTransaccion.valor) },
                                                        { where: { id: cuentaB.id }, transaction: t });
                                                });
                                            });
                                        }).then(function (result) {
                                            console.log('**********************************PAGO EXITOSO**********************************');
                                            req.flash('success', 'El pago se ha realizado con éxito.');
                                            res.render('pago/resultado', {
                                                titulo: 'Resultado', layout: 'layouts/administracion', resultado: JSON.stringify(response), message: req.flash()
                                            });
                                        }).catch(function (err) {
                                            console.log(err);
                                            console.log(JSON.stringify(err));
                                            console.log('**********************************ERROR EN EL PAGO**********************************');
                                            req.flash('danger', (err.errors) ? err.errors[0].message : 'Ocurrió un error inesperado. Vuelva a intentarlo.');
                                            res.redirect('/pago');
                                        });
                                    } else {
                                        req.flash('warning', 'Lo sentimos, Ocurrió un error al obtener el historial.');
                                        res.redirect('/pago');
                                    }
                                }).catch(err => {
                                    return next(err);
                                });
                            } else {
                                req.flash('warning', 'Lo sentimos, Ocurrió un error al obtener el movimiento.');
                                res.redirect('/pago');
                            }
                        }).catch(err => {
                            return next(err);
                        })
                    } else {
                        req.flash('warning', 'Lo sentimos, sus datos no han sido encontrados.');
                        res.redirect('/pago');
                    }
                }).catch(err => {
                    return next(err);
                });
            } else {
                req.flash('warning', 'Lo sentimos, Ocurrió un error al obtener el resultado.');
                res.redirect('/pago');
            }
        });
    }

    static request(amount, callback) {
        var path = '/v1/checkouts';
        var data = querystring.stringify({
            'authentication.userId': '8a8294175d602369015d73bf00e5180c',
            'authentication.password': 'dMq5MaTD5r',
            'authentication.entityId': '8a8294175d602369015d73bf009f1808',
            'amount': amount,
            'currency': 'USD',
            'paymentType': 'DB'
        });
        var options = {
            port: 443,
            host: 'test.oppwa.com',
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };
        var postRequest = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                var jsonRes = JSON.parse(chunk);
                return callback(jsonRes);
            });
        });
        postRequest.write(data);
        postRequest.end();
    }

    static result(id, callback) {
        var path = '/v1/checkouts/' + id + '/payment';
        path += '?authentication.userId=8a8294175d602369015d73bf00e5180c';
        path += '&authentication.password=dMq5MaTD5r';
        path += '&authentication.entityId=8a8294175d602369015d73bf009f1808';
        var options = {
            port: 443,
            host: 'test.oppwa.com',
            path: path,
            method: 'GET',
        };
        var postRequest = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                var jsonRes = JSON.parse(chunk);
                return callback(jsonRes);
            });
        });
        postRequest.end();
    }
}

module.exports = pagoController;