// 'use strict'
// var models = require('../models/index');
// var Persona = models.persona;
// var Cuenta = models.cuenta;
// var CuentaB = models.cuenta_bancaria;

// //ROLLBACK
// models.sequelize.transaction(function (t) {
//     return Persona.create({
//         cedula: '11058s3445939',
//         email: 'ejemploss.com'
//     }, { transaction: t }).then(function (persona) {
//         console.log("==================SE CREO LA PERSONA================");
//         return Cuenta.create({
//             usuario: persona.email
//         }, { transaction: t }).then(function (cuenta) {
//             console.log("==================SE CREO LA CUENTA================");
//         });
//     });
// }).then(function (result) {
//     console.log("==================TODO CORRECTO================");
//     // Transaction has been committed
//     // result is whatever the result of the promise chain returned to the transaction callback 
// }).catch(function (err) {
//     console.log(JSON.stringify(err));
//     console.log("==================ROLLBACK ACTIVADO================");
//     // Transaction has been rolled back
//     // err is whatever rejected the promise chain returned to the transaction callback
// });
//ROLLBACK

//NUMERO DE CUENTA
// function generarNroCuenta() {
//     var cod = [0, 3, 9, 8];
//     var ext = Math.floor(Math.random() * (10000 - 1000)) + 1000;
//     var cd = [];
//     var sNumber = ext.toString();
//     for (var i = 0, len = sNumber.length; i < len; i += 1) {
//         cd.push(+sNumber.charAt(i));
//     }
//     var j = [];
//     for (var i = 1; i < cd.length; i = i + 2) {
//         j.push(Math.floor((((cod[i - 1] + cd[i - 1]) / 2) + ((cod[i] + cd[i]) / 2)) / 2));
//     }
//     var k = cod.concat(cd.concat(j));
//     var nroC = k.join('');
//     return nroC;
// }

// console.log(busqueda(generarNroCuenta()));
//NUMERO DE CUENTA