
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.1)'; 
        button.style.transition = 'transform 0.3s'; 
        button.style.backgroundColor = 'blue';
    });
    // 
    button.addEventListener('mouseout', () => {
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = ''; 
    });
});


/* ANIMACION APARTADO REGISTRO */

document.addEventListener("DOMContentLoaded", function () {
    const tipoUsuario = document.getElementById("tipoUsuario");
    const tipoComercio = document.getElementById("tipoComercio");
    const form = document.getElementById("registroForm");

    tipoUsuario.addEventListener("change", () => {
        const valor = tipoUsuario.value;
        document.getElementById("datosComunes").style.display = valor ? "block" : "none";
        document.getElementById("formNatural").style.display = valor === "natural" ? "block" : "none";
        document.getElementById("comercioServicioSeleccion").style.display = valor === "comercio_servicio" ? "block" : "none";
        document.getElementById("formComerciante").style.display = "none";
        document.getElementById("formServicio").style.display = "none";
    });

    tipoComercio.addEventListener("change", () => {
        const valor = tipoComercio.value;
        document.getElementById("formComerciante").style.display = valor === "comerciante" ? "block" : "none";
        document.getElementById("formServicio").style.display = valor === "servicio" ? "block" : "none";
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // 🛠️ Desactivar campos requeridos ocultos
        const allRequiredFields = form.querySelectorAll("[required]");
        allRequiredFields.forEach(field => {
            if (field.offsetParent === null) {
                field.required = false;
            }
        });

        // Obtener valores seleccionados
        const tipo = tipoUsuario.value;
        const subtipo = tipoComercio.value;

        // Mensaje de éxito personalizado
        if (tipo === "comercio_servicio" && (subtipo === "comerciante" || subtipo === "servicio")) {
            alert("Registramos su solicitud, estará en proceso de revisión y creación de usuario.");
        } else {
            alert("Usuario registrado exitosamente.");
        }

        // Redirigir después de un breve retardo
        setTimeout(() => {
            window.location.href = "ingreso.html";
        }, 500);
    });
});
