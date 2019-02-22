module.exports = function (sequelize, Sequelize) {

    var Formulario = sequelize.define('formulario', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        p1: {
            type: Sequelize.STRING(50),
        },
        p2: {
            type: Sequelize.STRING(50)
        },
        p3: {
            type: Sequelize.STRING(50),
        },
        p4: {
            type: Sequelize.STRING(50)
        },
        p5: {
            type: Sequelize.STRING(50)
        },
        imagen: {
            type: Sequelize.STRING(50)
        }
    }, {
            freezeTableName: true,
            createdAt: 'fecha_reqistro',
            updatedAt: 'fecha_modificacion'
        });

    Formulario.associate = function (models) {
        models.formulario.hasOne(models.persona, {
            foreignKey: 'id_formulario'
        });
    };

    return Formulario;
};