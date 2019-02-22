module.exports = function (sequelize, Sequelize) {

    var Historial = sequelize.define('historial', {
        id: {
            primaryKey: true,
            type: Sequelize.STRING(5)
        },
        accion: {
            type: Sequelize.STRING
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });

    Historial.associate = function (models) {
        models.historial.hasMany(models.historial_persona, {
            foreignKey: 'id_historial'
        });
    };

    return Historial;
};