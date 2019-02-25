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
var authUser = require('./auth-controller');
var createError = require('http-errors');

class transaccionController {
    //Cargar vista para deposito
    vistaDeposito(req, res, next) {
        if (authUser(['Cajero'], req.user.rol)) {
            res.render('transferencias/deposito', { titulo: 'Depositos', layout: 'layouts/administracion', rol: req.user.auth, message: req.flash() });
        } else {
            return next(createError(401, 'Permiso Denegado.'))
        }
    }
    //Cargar vista para retiro
    vistaRetiro(req, res, next) {
        if (authUser(['Cajero'], req.user.rol)) {
            res.render('transferencias/retiro', { titulo: 'Retiros', layout: 'layouts/administracion', rol: req.user.auth, message: req.flash() });
        } else {
            return next(createError(401, 'Permiso Denegado.'))
        }
    }
    //Cargar vista para movimiento
    vistaTransferencia(req, res, next) {
        if (authUser(['Cliente'], req.user.rol)) {
            res.render('transferencias/transferencia', { titulo: 'Transferencias', rol: req.user.auth, layout: 'layouts/administracion', message: req.flash() });
        } else {
            return next(createError(401, 'Permiso Denegado.'))
        }
    }

    //buscar transacciones
    buscar(req, res, next) {
        if (authUser(['Servicio al Cliente'], req.user.rol)) {
            res.render('servicioClientes/buscar', { titulo: 'Transferencias', rol: req.user.auth, layout: 'layouts/administracion', message: req.flash() });
        } else {
            return next(createError(401, 'Permiso Denegado.'))
        }
    }

    //Lista general 
    listar(req, res, next) {
        Transaccion.findAll({ include: [{ model: Movimiento }, { model: Localizacion }, { model: CuentaB, include: [{ model: Persona }] }] }).then(transaccion => {
            if (transaccion) {
                res.json(transaccion);
            }
        });
    }

    //BUSCAR POR ACCION DE MOVIMIENTO
    //ACREDITA
    transaccionAcreditar(req, res, next) {
        Movimiento.findOne({ where: { tipo_movimiento: 'acreditar' } }).then(movimiento => {
            if (movimiento) {
                Transaccion.findAll({ where: { id_movimiento: movimiento.id }, include: [{ model: Movimiento }, { model: Localizacion }, { model: CuentaB, include: [{ model: Persona }] }] }).then(transaccion => {
                    if (transaccion) {
                        transaccionController.reporte(transaccion);
                        if (authUser(['Servicio al Cliente', 'Cliente'], req.user.rol)) {
                            res.render('transferencias/verTransacciones', { titulo: 'Lista de Transacciones', rol: req.user.auth, layout: 'layouts/administracion', message: req.flash(), transaccion: transaccion });
                        } else {
                            return next(createError(401, 'Permiso Denegado.'))
                        }
                    } else {
                        req.flash('danger', 'La cuenta no registra transacciones.');
                        res.redirect('/administracion');
                    }
                });
            } else {
                req.flash('danger', 'Error inesperado.');
                res.redirect('/administracion');
            }
        });
    }
    //DEBITAR
    transaccionDebitar(req, res, next) {
        Movimiento.findOne({ where: { tipo_movimiento: 'debitar' } }).then(movimiento => {
            if (movimiento) {
                Transaccion.findAll({ where: { id_movimiento: movimiento.id }, include: [{ model: Movimiento }, { model: Localizacion }, { model: CuentaB, include: [{ model: Persona }] }] }).then(transaccion => {
                    if (transaccion) {
                        transaccionController.reporte(transaccion);
                        if (authUser(['Servicio al Cliente', 'Cliente'], req.user.rol)) {
                            res.render('transferencias/verTransacciones', { titulo: 'Lista de Transacciones', rol: req.user.auth, layout: 'layouts/administracion', message: req.flash(), transaccion: transaccion });
                        } else {
                            return next(createError(401, 'Permiso Denegado.'))
                        }
                    } else {
                        req.flash('danger', 'La cuenta no registra transacciones.');
                        res.redirect('/administracion');
                    }
                });
            } else {
                req.flash('danger', 'Error inesperado.');
                res.redirect('/administracion');
            }
        });
    }
    //Buscar transacciones por numero de cuenta Bancaria
    transaccionNumero(req, res, next) {
        CuentaB.findOne({ where: { nro_cuenta: (req.body.buscar.trim()), estado_cuenta: true } }).then(cuentaB => {
            if (cuentaB) {
                Transaccion.findAll({ where: { id_cuenta_bancaria: cuentaB.id }, include: [{ model: Movimiento }, { model: Localizacion }, { model: CuentaB, include: [{ model: Persona }] }] }).then(transaccion => {
                    if (transaccion) {
                        transaccionController.reporte(transaccion);
                        if (authUser(['Servicio al Cliente'], req.user.rol)) {
                            res.render('transferencias/verTransacciones', { titulo: 'Lista de Transacciones', rol: req.user.auth, layout: 'layouts/administracion', message: req.flash(), transaccion: transaccion });
                        } else {
                            return next(createError(401, 'Permiso Denegado.'))
                        }
                    } else {
                        req.flash('danger', 'La cuenta no registra transacciones.');
                        res.redirect('/administracion');
                    }
                }).catch(err => {
                    return next(err);
                });
            } else {
                req.flash('danger', 'La cuenta no ha sido encontrada, puede que no exista o que haya sido desactivada.');
                res.redirect('/administracion');
            }
        }).catch(err => {
            return next(err);
        });
    }
    //Listar transacciones por cedula de cliente
    transaccionCedula(req, res, next) {
        Persona.findOne({ where: { cedula: (req.body.buscar.trim()), id_rol: 4 } }).then(persona => {
            if (persona) {
                CuentaB.findOne({ where: { id_persona: persona.id, estado_cuenta: true } }).then(cuentaB => {
                    if (cuentaB) {
                        Transaccion.findAll({ where: { id_cuenta_bancaria: cuentaB.id }, include: [{ model: Movimiento }, { model: Localizacion }, { model: CuentaB, include: [{ model: Persona }] }] }).then(transaccion => {
                            if (transaccion) {
                                transaccionController.reporte(transaccion);
                                if (authUser(['Servicio al Cliente'], req.user.rol)) {
                                    res.render('transferencias/verTransacciones', { titulo: 'Lista de Transacciones', rol: req.user.auth, layout: 'layouts/administracion', message: req.flash(), transaccion: transaccion });
                                } else {
                                    return next(createError(401, 'Permiso Denegado.'))
                                }
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
                if ((req.body.valor * 1) > 0) {
                    return Movimiento.findOne({ where: { id: 1 } }).then(function (movimiento) {
                        if (movimiento) {
                            return sequelize.transaction(function (t) {
                                console.log("***********************************************************************************");
                                console.log(JSON.stringify(req.body));
                                var modeloLocalizacion = {
                                    ciudad: (req.body.ciudad.trim()),
                                    pais: (req.body.pais.trim()),
                                    latitud: (req.body.latitud.trim()),
                                    longitud: (req.body.longitud.trim()),
                                    ip: (req.body.ip.trim()),
                                    provincia: (req.body.provincia.trim())
                                };
                                return Localizacion.create(modeloLocalizacion, { transaction: t }).then(function (newLocalizacion) {
                                    var modeloTransaccion = {
                                        valor: req.body.valor * 1,
                                        nro_cuenta: (req.body.nro.trim()),
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
                    req.flash('danger', 'El valor ingresado no es valido');
                    res.redirect('/administracion');
                }

            } else {
                req.flash('danger', 'No se pudo encontrar la cuenta');
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
                if ((req.body.valor * 1) > 0) {
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
                                                valor: req.body.valor * 1,
                                                nro_cuenta: (req.body.nro.trim()),
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
                    req.flash('danger', 'El valor ingresado no es valido');
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
                        if ((req.body.valor * 1) > 0) {
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
                                                    nro_cuenta: (req.body.nro.trim()),
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
                            req.flash('danger', 'El valor ingresado no es valido');
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
    static reporte(data) {
        var contenido = "";
        contenido += '<table border="1" id= "tabla" class="table table-bordered" id="dataTable" width="100%" cellspacing="0">';
        contenido += ' <thead> ';
        contenido += '<tr>';
        contenido += '<th>Nro</th>';
        contenido += '<th>Fecha</th>';
        contenido += '<th>Tipo</th>';
        contenido += '<th>Valor</th>';
        contenido += '<th>Saldo</th>';
        //                                contenido += '<th>Acciones</th>';
        contenido += ' </tr>';
        contenido += ' </thead>';
        contenido += '<tbody id="tb">';
        data.forEach(function (item, index) {
            contenido += '<tr>';
            contenido += '<td>' + (index + 1) + '</td>';
            contenido += '<td>' + item.fecha_transaccion + '</td>';
            contenido += '<td>' + item.movimiento.siglas + '</td>';
            contenido += '<td> $' + item.valor + '</td>';
            contenido += '<td> $' + item.cuenta_bancarium.saldo + '</td>';
            contenido += '</tr>';
        });
        contenido += '</tbody>';
        contenido += '</table>';
        var options = {
            "format": 'A4',
            "orientation": "portrait",
            "header": {
                //                "height": "60px",
                "width": "4in"
            },
            "footer": {
                "height": "22mm"
            },
            "body": {
                "font - family": "Verdana, Arial, Helvetica, sans - serif",
                "font - size": "12px",
                "text - align": " right",
                "width": "600px"
            },
            "#table th": {
                "padding": "5px",
                "      font-size": "16px",
                "      background-color": "#83aec0",
                "  background-repeat": "repeat - x",
                "color": "#FFFFFF",
                "border-right-width": "1px",
                "border-bottom-width": "1px",
                "border-right-style": "solid",
                "border-bottom-style": "solid",
                "border-right-color": "#558FA6",
                "border-bottom-color": "#558FA6",
                "font-family": " “Trebuchet MS”, Arial",
                "text-transform": "uppercase"
            },
            "border": {
                "top": "1in", // default is 0, units: mm, cm, in, px
                "right": "1in",
                "bottom": "1in",
                "left": "1in"
            },
            paginationOffset: 1, // Override the initial pagination number
            "header": {
                "height": "15mm",
                "contents": '<div style="text-align: center;">Historial de transacciones | CDB</div>'
            },
            "footer": {
                "height": "28mm",
                "contents": {
                    default: '<span style="color: #444;">Cooperativa Doña Bachita | CDB</span>', // fallback value
                }
            },
            "base": 'file://Users/midesweb/carpeta_base/',
            "zoomFactor": "1", // default is 1

            // File options
            "type": "pdf", // allowed file types: png, jpeg, pdf
            "quality": "75",
            "renderDelay": 1000,
            // HTTP Headers that are used for requests
            "httpHeaders": {
                // e.g.
                "Authorization": "Bearer ACEFAD8C-4B4D-4042-AB30-6C735F5BAC8B"
            },
            // To run Node application as Windows service
            "childProcessOptions": {
                "detached": true
            }
        };
        pdf.create(contenido, options).toFile('./reporte.pdf', function (error, response) {
            if (error) {
                console.log("No se ha creado");
            } else {
                console.log("Se ha creado");
            }
        });
    }
}

module.exports = transaccionController;