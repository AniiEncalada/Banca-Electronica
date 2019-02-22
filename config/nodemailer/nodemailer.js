var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'coopdbachita@gmail.com',
        pass: 'cooperativa'
    }
});

module.exports = function (mailOptions) {
    return transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            return console.log("*********************EMAIL NO ENVIADO********************* " + err);
        } else {
            return console.log("*********************EMAIL ENVIADO********************* " + info);
        }
    });
};