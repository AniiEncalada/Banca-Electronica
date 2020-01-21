var bCrypt = require('bcrypt-nodejs');
const uuidv4 = require('uuid/v4');
var nodemailer = require('../nodemailer/nodemailer');

module.exports = function (passport, cuenta, persona, rol, historial, historial_persona, sequelize) {
    var Cuenta = cuenta;
    var Persona = persona;
    var Rol = rol;
    var Historial = historial;
    var HistorialPersona = historial_persona;
    var SequelizeT = sequelize;
    var LocalStrategy = require('passport-local').Strategy;

    passport.serializeUser(function (cuenta, done) {
        done(null, cuenta.id);
    });

    passport.deserializeUser(function (id, done) {
        Cuenta.findOne({
            where: { id: id }, include: [{ model: persona, include: { model: rol } }]
        }).then(function (cuenta) {
            if (cuenta) {
                var auth;
                switch (cuenta.persona.rol.id) {
                    case 1:
                        auth = { administrador: cuenta.persona.rol.nombre }
                        break;
                    case 2:
                        auth = { servicioCliente: cuenta.persona.rol.nombre }
                        break;
                    case 3:
                        auth = { cajero: cuenta.persona.rol.nombre }
                        break;
                    case 4:
                        auth = { cliente: cuenta.persona.rol.nombre }
                        break;
                    default:
                        break;
                }
                var userinfo = {
                    id: cuenta.id,
                    id_cuenta: cuenta.externalId,
                    id_persona: cuenta.persona.externalId,
                    persona: cuenta.persona.id,
                    nombre: cuenta.persona.apellido + " " + cuenta.persona.nombre,
                    rol: cuenta.persona.rol.nombre,
                    estado: cuenta.estado,
                    auth: auth
                };
                console.log(userinfo);
                done(null, userinfo);
            } else {
                done(cuenta, null);
            }
        });

    });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'correo',
        passwordField: 'cedula',
        passReqToCallback: true
    }, function (req, email, password, done) {
        var generarClave = function (password) {
            return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        };
        Cuenta.findOne({
            where: { usuario: email }
        }).then(function (cuenta) {
            if (cuenta) {
                console.log('**********************************USUARIO YA REGISTRADO**********************************');
                return done(null, false, req.flash('warning', 'Personal ya registrado.'));
            } else {
                var clave = generarClave(password);
                return Rol.findOne({
                    where: {
                        id: req.body.rol
                    }
                }).then(function (rol) {
                    if (rol) {
                        return SequelizeT.transaction(function (t) {
                            var modeloPersona = {
                                apellido: req.body.apellido,
                                nombre: req.body.nombre,
                                email: email,
                                cedula: req.body.cedula,
                                telefono: req.body.telefono,
                                ciudad: req.body.ciudad,
                                barrio: req.body.barrio,
                                callePrincipal: req.body.callePrincipal,
                                calleSecundaria: req.body.calleSecundaria,
                                numeroCasa: req.body.numeroCasa,
                                externalId: uuidv4(),
                                id_rol: rol.id,
                            };
                            return Persona.create(modeloPersona, { transaction: t }).then(function (newPersona) {
                                console.log("**********************************PERSONA CREADA**********************************");
                                var modeloCuenta = {
                                    usuario: email,
                                    clave: clave,
                                    id_persona: newPersona.id,
                                    externalId: uuidv4()
                                };
                                return Cuenta.create(modeloCuenta, { transaction: t }).then(function (newCuenta) {
                                    console.log("**********************************CUENTA CREADA**********************************");
                                    return Historial.findOne({ where: { id: 'cc' } }, { transaction: t }).then(function (historial) {
                                        var modeloHistorialPersona = {
                                            actor_accion: req.user.nombre,
                                            lugar_accion: 'LUGAR',
                                            fecha_accion: new Date(),
                                            id_persona: newPersona.id,
                                            id_historial: historial.id
                                        };
                                        return HistorialPersona.create(modeloHistorialPersona, { transaction: t }).then(function (newHistorial) {
                                            console.log("**********************************HISTORIAL CREADO**********************************");
                                            var mailOptions = {
                                                from: 'CDB',
                                                to: 'victor.rojas@unl.edu.ec',
                                                subject: 'Confirmación de Cuenta',
                                                text: 'Se necesita que confirme su cuenta: http:localhost:3000/administracion'
                                            };
                                            nodemailer(mailOptions);
                                            return done(null, req.user, req.flash('success', 'Se ha realizado el registro con éxito.'));
                                        });
                                    });
                                });
                            });
                        }).then(function (result) {
                            console.log('**********************************REGISTRO EXITOSO**********************************');
                        }).catch(function (err) {
                            console.log('**********************************ERROR EN EL REGISTRO**********************************');
                            return done(null, false, req.flash('danger', (err.errors) ? err.errors[0].message : 'Ocurrió un error inesperado. Vuelva a intentarlo.'));
                        });
                    } else {
                        return done(null, false);
                    }
                }).catch(err => {
                    return done(err);
                });
            }
        }).catch(err => {
            return done(err);
        });
    }));

    passport.use('local-signin', new LocalStrategy({
        usernameField: 'correo',
        passwordField: 'clave',
        passReqToCallback: true
    }, function (req, email, password, done) {
        var Cuenta = cuenta;
        var isValidPassword = function (userpass, password) {
            return bCrypt.compareSync(password, userpass);
        };
        Cuenta.findOne({ where: { usuario: email } }).then(function (cuenta) {
            if (!cuenta) {
                return done(null, false, req.flash('danger', 'La cuenta no existe.'));
            }
            if (!isValidPassword(cuenta.clave, password)) {
                return done(null, false, req.flash('danger', 'La clave ingresada no es la correcta.'));
            }
            var userinfo = cuenta.get();
            return done(null, userinfo);

        }).catch(function (err) {
            err.message = "Ocurrió un error al iniciar sesión.";
            return done(err);
        });
    }));
}