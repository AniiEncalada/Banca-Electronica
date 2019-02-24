module.exports = function (sequelize, Sequelize) {

    var cuentaBancaria = require('./cuenta-bancaria');
    var CuentaBancaria = new cuentaBancaria(sequelize, Sequelize);
    var movimiento = require('./movimiento');
    var Movimiento = new movimiento(sequelize, Sequelize);
    var localizacion = require('./localizacion');
    var Localizacion = new localizacion(sequelize, Sequelize);

    var Transaccion = sequelize.define('transaccion', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        valor: {
            type: Sequelize.DOUBLE
        },
        nro_cuenta: {
            type: Sequelize.INTEGER
        },
        fecha_transaccion: {
            type: Sequelize.DATE
        }
    }, {
            freezeTableName: true,
            timestamps: false
        });

    Transaccion.belongsTo(CuentaBancaria, {
        foreignKey: 'id_cuenta_bancaria',
        constraints: false
    });
    Transaccion.belongsTo(Movimiento, {
        foreignKey: 'id_movimiento',
        constraints: false
    });
    Transaccion.belongsTo(Localizacion, {
        foreignKey: 'id_localizacion',
        constraints: false
    });

    return Transaccion;
};