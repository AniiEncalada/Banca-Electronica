module.exports = function (sequelize, Sequelize) {

    var Localizacion = sequelize.define('localizacion', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        ciudad: {
            type: Sequelize.STRING(50)
        },
        pais: {
            type: Sequelize.STRING(50)
        },
        latitud: {
            type: Sequelize.DOUBLE
        },
        longitud: {
            type: Sequelize.DOUBLE
        },
        ip: {
            type: Sequelize.STRING(20)
        },
        provincia: {
            type: Sequelize.STRING(50)
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });

    Localizacion.associate = function (models) {
        models.localizacion.hasOne(models.transaccion, {
            foreignKey: 'id_localizacion'
        });
    };

    return Localizacion;
};