
//codigo para insercion a la base de datos

document.addEventListener("DOMContentLoaded", () => {
    const formRegistro = document.getElementById("formRegistro");

    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Detecta el tipo de usuario
        const tipoUsuario = document.getElementById("tipoUsuario").value;

        // Usamos FormData porque incluye texto + imágenes
        const formData = new FormData();

        // Datos comunes (Perfil) según el tipo de usuario
        if (tipoUsuario === "natural") {
            formData.append("Usuario", document.getElementById("Usuario").value);
            formData.append("Nombre", document.getElementById("Nombre").value);
            formData.append("Correo", document.getElementById("Correo").value);
            formData.append("Direccion", document.getElementById("Direccion").value);
            formData.append("Telefono", document.getElementById("Telefono").value);
            formData.append("Barrio", document.getElementById("Barrio").value);

            const fotoPerfil = document.getElementById("FotoPerfil")?.files[0];
            if (fotoPerfil) formData.append("FotoPerfil", fotoPerfil);
        }

        if (tipoUsuario === "comerciante") {
            formData.append("Usuario", document.getElementById("UsuarioComercio").value);
            formData.append("Nombre", document.getElementById("NombreComerciante").value);
            formData.append("Correo", document.getElementById("CorreoComercio").value);
            formData.append("Direccion", document.getElementById("DireccionComercio").value);
            formData.append("Telefono", document.getElementById("TelefonoComercio").value);
            formData.append("Barrio", document.getElementById("BarrioComercio").value);

            const fotoPerfil = document.getElementById("fotoPerfilComercio")?.files[0];
            if (fotoPerfil) formData.append("FotoPerfil", fotoPerfil);

            formData.append("DiasAtencion", document.getElementById("DiasAtencion").value);
            formData.append("RedesSociales", document.getElementById("RedesSociales").value);
            formData.append("NombreComercio", document.getElementById("NombreComercio").value);
            formData.append("NitComercio", document.getElementById("InfoVendedor").value);
            formData.append("HoraInicio", document.getElementById("horaInicio").value);
            formData.append("HoraFin", document.getElementById("horaFin").value);
        }

        if (tipoUsuario === "servicio") {
            formData.append("Usuario", document.getElementById("UsuarioServicio").value);
            formData.append("Nombre", document.getElementById("NombreServicio").value);
            formData.append("Correo", document.getElementById("CorreoServicio").value);
            formData.append("Direccion", document.getElementById("DireccionServicio").value);
            formData.append("Telefono", document.getElementById("TelefonoServicio").value);
            formData.append("Barrio", document.getElementById("BarrioServicio").value);

            const fotoPerfil = document.getElementById("fotoPerfilServicio")?.files[0];
            if (fotoPerfil) formData.append("FotoPerfil", fotoPerfil);

            const certificado = document.getElementById("Certificado")?.files[0];
            if (certificado) formData.append("Certificado", certificado);

            formData.append("DiasAtencion", document.getElementById("diasAtencionServicio").value);
            formData.append("RedesSociales", document.getElementById("RedesSocialesServicio").value);
            formData.append("HoraInicio", document.getElementById("horaInicioServicio").value);
            formData.append("HoraFin", document.getElementById("horaFinServicio").value);
        }

        // Tipo de usuario general
        formData.append("TipoUsuario", tipoUsuario);

        try {
            const res = await fetch("/api/registro", {
                method: "POST",
                body: formData // 👈 no headers porque FormData se encarga
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ Registro exitoso");
                console.log("Respuesta del servidor:", data);
                window.location.href = "ingreso.html";
            } else {
                alert("⚠️ Error: " + (data.error || "No se pudo registrar"));
            }
        } catch (err) {
            console.error("Error en fetch:", err);
            alert("⚠️ Error al conectar con el servidor");
        }
    });
});





