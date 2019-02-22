'use strict';
var models = require('../models/index');
var Persona = models.persona;
var Rol = models.rol;
class personaController {
    listar(req, res) {
        Persona.findAll({include: [{model: Rol}]}).then(personas => {
            if (personas) {
                res.status(200).json(personas);
            }
        }).catch(err => {
            console.log(err);
        });
    }
}
module.exports = personaController;