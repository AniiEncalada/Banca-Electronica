module.exports = function (sequelize, Sequelize) {

    var persona = require('./persona');
    var Persona = new persona(sequelize, Sequelize);

    var Cuenta = sequelize.define('cuenta', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        externalId: {
            type: Sequelize.UUID
        },
        estado: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        usuario: {
            type: Sequelize.STRING(50),
            unique: true
        },
        clave: {
            type: Sequelize.STRING(150)
        }
    }, {
        freezeTableName: true,
        createdAt: 'fecha_reqistro',
        updatedAt: 'fecha_modificacion'
    });

    Cuenta.belongsTo(Persona, {
        foreignKey: 'id_persona',
        constraints: false
    });

    return Cuenta;
};