$().ready(function () {
    // Mensajes de Validación
    $.extend($.validator.messages, {
        required: "Este campo es obligatorio.",
        remote: "Por favor, rellena este campo.",
        email: "Por favor, escriba una dirección de correo válida.",
        url: "Por favor, escriba una URL válida.",
        date: "Por favor, escriba una fecha válida.",
        dateISO: "Por favor, escriba una fecha (ISO) válida.",
        number: "Por favor, escriba un número válido.",
        digits: "Por favor, escriba sólo dígitos.",
        creditcard: "Por favor, escriba un número de tarjeta válido.",
        equalTo: "Por favor, escriba el mismo valor de nuevo.",
        extension: "Por favor, escriba un valor con una extensión aceptada.",
        maxlength: $.validator.format("Por favor, no escriba más de {0} caracteres."),
        minlength: $.validator.format("Por favor, no escriba menos de {0} caracteres."),
        rangelength: $.validator.format("Por favor, escriba un valor entre {0} y {1} caracteres."),
        range: $.validator.format("Por favor, escriba un valor entre {0} y {1}."),
        max: $.validator.format("Por favor, escriba un valor menor o igual a {0}."),
        min: $.validator.format("Por favor, escriba un valor mayor o igual a {0}."),
        nifES: "Por favor, escriba un NIF válido.",
        nieES: "Por favor, escriba un NIE válido.",
        cifES: "Por favor, escriba un CIF válido.",
        cedula: "La cédula ingresada no es válida.",
        lettersonly: "Este campo solamente puede contener letras."
    });

    // Otros métodos
    $.validator.addMethod("cedula", function (value) {
        return validarCedula(value);
    });
    $.validator.addMethod("lettersonly", function (value, element) {
        return this.optional(element) || /^[a-zá-ź ]+$/i.test(value);
    });

    // Validación
    $(".formulario").validate({
        errorElement: 'div',
        normalizer: function (value) {
            return $.trim(value);
        },
        rules: {
            nombre: {
                lettersonly: true,
            },
            apellido: {
                lettersonly: true,
            },
            cedula: {
                // cedula: true
            }
        }
    });
});

// Función de validación de cédula
function validarCedula(cedula) {
    var cad = cedula.trim();
    var total = 0;
    var longitud = cad.length;
    var longcheck = longitud - 1;
    var flag = false;
    if (cad !== "" && longitud === 10) {
        for (var i = 0; i < longcheck; i++) {
            if (i % 2 === 0) {
                var aux = cad.charAt(i) * 2;
                if (aux > 9)
                    aux -= 9;
                total += aux;
            } else {
                total += parseInt(cad.charAt(i));
            }
        }
        total = total % 10 ? 10 - total % 10 : 0;
        if (cad.charAt(longitud - 1) == total) {
            flag = true;
        }
    }
    return flag;
}