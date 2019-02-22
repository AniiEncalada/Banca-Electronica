module.exports = function (sequelize, Sequelize) {

    var Movimiento = sequelize.define('movimiento', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        siglas: {
            type: Sequelize.STRING(5)
        },
        tipo_movimiento: {
            type: Sequelize.STRING(20)
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });

    Movimiento.associate = function (models) {
        models.movimiento.hasOne(models.transaccion, {
            foreignKey: 'id_movimiento'
        });
    };

    return Movimiento;
};