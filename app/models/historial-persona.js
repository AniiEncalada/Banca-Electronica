module.exports = function (sequelize, Sequelize) {

    var persona = require('./persona');
    var Persona = new persona(sequelize, Sequelize);
    var historial = require('./historial');
    var Historial = new historial(sequelize, Sequelize);

    var HistorialPersona = sequelize.define('historial_persona', {
        actor_accion: {
            type: Sequelize.STRING(50)
        },
        lugar_accion: {
            type: Sequelize.STRING
        },
        fecha_accion: {
            type: Sequelize.DATE
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });

    HistorialPersona.belongsTo(Persona, {
        foreignKey: 'id_persona',
        constraints: false
    });
    HistorialPersona.belongsTo(Historial, {
        foreignKey: 'id_historial',
        constraints: false
    });

    return HistorialPersona;
};