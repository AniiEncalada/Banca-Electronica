module.exports = function (sequelize, Sequelize) {

    var persona = require('./persona');
    var Persona = new persona(sequelize, Sequelize);

    var CuentaBancaria = sequelize.define('cuenta_bancaria', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        externalId: {
            type: Sequelize.UUID
        },
        estado_cuenta: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        nro_cuenta: {
            type: Sequelize.STRING(10)

        },
        saldo: {
            type: Sequelize.DOUBLE
        },
        fecha_cierre: {
            type: Sequelize.DATE
        }
    }, {
            freezeTableName: true,
            createdAt: 'fecha_apertura',
            updatedAt: 'fecha_modificacion'
        });

    CuentaBancaria.belongsTo(Persona, {
        foreignKey: 'id_persona',
        constraints: false
    });

    CuentaBancaria.associate = function (models) {
        models.cuenta_bancaria.hasMany(models.transaccion, {
            foreignKey: 'id_cuenta_bancaria'
        });
    };

    return CuentaBancaria;
};