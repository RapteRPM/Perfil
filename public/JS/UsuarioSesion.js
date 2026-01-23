// 📁 public/JS/usuarioSesion.js
import { API_CONFIG, fetchAPI } from './api-config.js';

// 🧭 Función para cargar la info del usuario en el header (nombre y foto)
async function cargarUsuarioHeader() {
  try {
    const res = await fetchAPI(API_CONFIG.AUTH.USUARIO_ACTUAL);
    if (!res.ok) throw new Error("No autenticado");

    const data = await res.json();

    const nombreEl = document.getElementById("nombre-usuario");
    const fotoEl = document.getElementById("foto-usuario");

    if (nombreEl) nombreEl.textContent = data.nombre || "Usuario";
    if (fotoEl) fotoEl.src = data.foto || "/image/imagen_perfil.png";
  } catch (error) {
    console.warn("⚠️ No se pudo cargar la sesión:", error);
    const nombreEl = document.getElementById("nombre-usuario");
    const fotoEl = document.getElementById("foto-usuario");

    if (nombreEl) nombreEl.textContent = "Invitado";
    if (fotoEl) fotoEl.src = "/image/imagen_perfil.png";
  }
}

// ⚙️ Función general para verificar sesión y tipo de usuario (sin redirigir)
async function verificarSesion(usuarioEsperadoTipo = null) {
  try {
    const res = await fetch("/api/sesion-usuario");
    if (!res.ok) return null;

    const usuario = await res.json();
    if (!usuario) return null;

    // Si se espera un tipo específico y no coincide
    if (usuarioEsperadoTipo && usuario.tipo !== usuarioEsperadoTipo) {
      console.warn(`El usuario no es del tipo esperado (${usuarioEsperadoTipo}).`);
      return null;
    }

    return usuario; // ✅ Devuelve el usuario si está logueado
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    return null;
  }
}
