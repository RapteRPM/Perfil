// 🧭 Verificación de sesión y renderizado de perfil en el header
import { API_CONFIG, fetchAPI } from './api-config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("perfilHeader");

  let usuario = null;
  try {
    const res = await fetchAPI(API_CONFIG.AUTH.USUARIO_ACTUAL);
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
        <a href="ingreso.html" class="btn btn-outline-light">Ingresar</a>
      `;
    }
    return;
  }

  // 🧩 Mostrar perfil en el header
  if (contenedor && usuario) {
    const perfilHTML = `
      <div class="dropdown">
        <button class="flex items-center bg-transparent border-0 text-white" id="perfilDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="${usuario.foto || 'image/imagen_perfil.png'}" alt="Usuario" class="w-16 h-16 object-cover rounded-full border-2 border-white mr-2"/>
          <span class="font-semibold text-lg">${usuario.nombre || 'Usuario'}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="perfilDropdown">
          <li><a class="dropdown-item" href="Editar_perfil.html">Configuración Perfil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="cerrarSesion">Cerrar sesión</a></li>
        </ul>
      </div>
    `;
    contenedor.innerHTML = perfilHTML;

    document.getElementById("cerrarSesion").addEventListener("click", () => {
      localStorage.removeItem("usuarioActivo");
      window.location.href = "ingreso.html";
    });
  }
});

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
    const res = await fetch("http://localhost:3000/api/centro-ayuda", {
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