module.exports = function (sequelize, Sequelize) {

    var rol = require('./rol');
    var Rol = new rol(sequelize, Sequelize);

    var formulario = require('./formularioRegistro');
    var Formulario = new formulario(sequelize, Sequelize);
    var Persona = sequelize.define('persona', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        externalId: {
            type: Sequelize.UUID
        },
        nombre: {
            type: Sequelize.STRING(50)
        },
        apellido: {
            type: Sequelize.STRING(50)
        },
        cedula: {
            type: Sequelize.STRING(10),
            unique: {
                args: true,
                msg: 'La cédula ingresada ya se encuentra registrada.'
            },
            allowNull: false
        },
        ciudad:{
            type: Sequelize.STRING(50)
        },
        barrio: {
            type: Sequelize.STRING(50)
        },
        callePrincipal:{
            type: Sequelize.STRING(100)
        },
        calleSecundaria:{
            type: Sequelize.STRING(100)
        },
        numeroCasa: {
            type: Sequelize.STRING(10)
        },
        telefono: {
            type: Sequelize.STRING(13)
        },
        email: {
            type: Sequelize.STRING(70),
        }
    }, {
        freezeTableName: true,
        createdAt: 'fecha_reqistro',
        updatedAt: 'fecha_modificacion'
    });

    Persona.belongsTo(Rol, {
        foreignKey: 'id_rol',
        constraints: false
    });
    Persona.belongsTo(Formulario, {
        foreignKey: 'id_formulario',
        constraints: false
    });

    Persona.associate = function (models) {
        models.persona.hasOne(models.cuenta, {
            foreignKey: 'id_persona'
        });
        models.persona.hasOne(models.cuenta_bancaria, {
            foreignKey: 'id_persona'
        });
        models.persona.hasMany(models.historial_persona, {
            foreignKey: 'id_persona'
        });
    };

    return Persona;
};