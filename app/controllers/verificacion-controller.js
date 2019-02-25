'use strict';
var models = require('../models/index');
var Persona = models.persona;
var Cuenta = models.cuenta;
var Formulario = models.formulario;
var sequelize = models.sequelize;

class VerificacionController {
    
    guardar(req, res, next) {
        return sequelize.transaction(function (t) {
            var modeloFormulario = {
                p1: req.body.p1,
                p2: req.body.p2,
                p3: req.body.p3,
                p4: req.body.p4,
                p5: req.body.p5,
                imagen: req.body.imagen
            };
            return Formulario.create(modeloFormulario, { transaction: t }).then(function (newFormulario) {
                return Persona.update({ id_formulario: newFormulario.id },
                    { where: { externalId: req.user.id_persona } }, { transaction: t }).then(function (persona) {
                        return Cuenta.update({ estado: true }, { where: { id: req.user.id } }, { transaction: t });
                    });
            });
        }).then(function (result) {
            req.flash('success', 'La activación se ha realizado con éxito.');
            res.redirect('/administracion');
        }).catch(function (err) {
            req.flash('danger', 'Ha ocurrido un error con la activación.');
            res.redirect('/verificar');
        });
    }
}

module.exports = VerificacionController;