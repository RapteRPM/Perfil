// 🧭 Verificación de sesión y renderizado de perfil en el header
document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("perfilHeader");

  let usuario = null;
  try {
    const res = await fetch("/api/usuario-actual", { credentials: "include" });
    if (!res.ok) throw new Error("No hay sesión activa");

    const data = await res.json();
    usuario = {
      id: data.id,
      nombre: data.nombre,
      tipo: data.tipo,
      foto: data.foto
    };

    localStorage.setItem("usuarioActivo", JSON.stringify(usuario));
  } catch (error) {
    console.warn("⚠️ Sesión no activa. Limpiando localStorage.");
    localStorage.removeItem("usuarioActivo");

    if (contenedor) {
      contenedor.innerHTML = `
        <a href="Ingreso.html" class="btn btn-outline-light">Ingresar</a>
      `;
    }
    return;
  }

  // 🧩 Mostrar perfil en el header
  if (contenedor && usuario) {
    const perfilHTML = `
      <div class="dropdown">
        <button class="flex items-center bg-transparent border-0 text-white" id="perfilDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="${window.RPM_PORTABLE_PATHS?.normalizeImageUrl(usuario.foto) || '/image/imagen_perfil.png'}" alt="Usuario" class="w-16 h-16 object-cover rounded-full border-2 border-white mr-2"/>
          <span class="font-semibold text-lg">${usuario.nombre || 'Usuario'}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="perfilDropdown">
          <li><a class="dropdown-item" href="../Natural/Editar_perfil.html">Configuración Perfil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="cerrarSesion">Cerrar sesión</a></li>
        </ul>
      </div>
    `;
    contenedor.innerHTML = perfilHTML;

    document.getElementById("cerrarSesion").addEventListener("click", () => {
      localStorage.removeItem("usuarioActivo");
      window.location.href = "Ingreso.html";
    });
  }

  // 🏠 Actualizar botón de Inicio según el tipo de usuario
  actualizarBotonInicio(usuario);
});

// 🏠 Función para actualizar el botón de inicio según el tipo de usuario
function actualizarBotonInicio(usuario) {
  const botonInicio = document.querySelector('a[href="../General/index.html"]');
  if (!botonInicio) return;

  if (!usuario || !usuario.tipo) {
    // Si no hay sesión, mantener el enlace a index.html
    botonInicio.href = "../General/index.html";
    return;
  }

  // Redirigir según el tipo de usuario
  switch (usuario.tipo) {
    case "Natural":
      botonInicio.href = "../Natural/perfil_usuario.html";
      break;
    case "Comerciante":
      botonInicio.href = "../Comerciante/perfil_comerciante.html";
      break;
    case "PrestadorServicio":
      botonInicio.href = "../PrestadorServicios/perfil_servicios.html";
      break;
    default:
      botonInicio.href = "../General/index.html";
  }
}

// 📤 Envío del formulario de ayuda
document.getElementById("formAyuda").addEventListener("submit", async function (e) {
  e.preventDefault();

  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  } catch {
    usuario = null;
  }

  const perfilId = usuario?.id;
  if (!usuario || !perfilId) {
    alert("⚠️ Debes iniciar una sesión para hacer esta solicitud.");
    return;
  }

  const solicitud = {
    perfil: perfilId,
    tipoSolicitud: document.getElementById("tipo").value,
    rol: usuario.tipo === "Comerciante"
      ? "Comerciante"
      : usuario.tipo === "PrestadorServicio"
      ? "PrestadorServicio"
      : "Usuario Natural",
    asunto: document.getElementById("asunto").value,
    descripcion: document.getElementById("descripcion").value
  };

  try {
    const res = await fetch("/api/centro-ayuda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(solicitud)
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById("mensajeExito").classList.remove("d-none");
      this.reset();
    } else {
      alert("❌ " + data.error);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("❌ No se pudo conectar con el servidor.");
  }
});