// 📁 public/JS/perfil_usuario.js
import { API_CONFIG, fetchAPI } from './api-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const nombreUsuario = document.getElementById('nombre-usuario');
  const fotoUsuario = document.getElementById('foto-usuario');

  try {
    const response = await fetchAPI(API_CONFIG.AUTH.USUARIO_ACTUAL);
    if (!response.ok) throw new Error("Error al obtener datos del usuario");

    const data = await response.json();

    // Mostrar datos en el header
    nombreUsuario.textContent = data.nombre || 'Usuario';
    fotoUsuario.src = data.foto || '/image/imagen_perfil.png';

    // 🧩 Guardar usuario en localStorage para usarlo en otras páginas
    localStorage.setItem('usuarioActivo', JSON.stringify({
      id: data.id || data.IdUsuario, // asegúrate que el backend devuelva "id"
      nombre: data.nombre,
      tipo: data.tipo
    }));

    console.log("✅ Datos del usuario cargados:", data);

  } catch (error) {
    console.error("❌ Error al obtener datos del usuario:", error);

    // Si no hay sesión activa, limpiar localStorage
    localStorage.removeItem('usuarioActivo');

    nombreUsuario.textContent = 'Invitado';
    fotoUsuario.src = '/image/imagen_perfil.png';
  }
});
