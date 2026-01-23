// 📂 public/JS/app.js
// Nota: Asegúrate de cargar api-url-config.js ANTES de este archivo

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('user-name').value.trim();
  const password = document.getElementById('input-pass').value.trim();
  const mensajeError = document.getElementById('mensaje-error');

  const API_URL = window.API_URL || 'http://localhost:3000';
  console.log('🔐 Intentando login en:', API_URL);

  try {
    // ✅ Petición directa con fetch
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // ⚠️ CRÍTICO para sesiones
      body: JSON.stringify({ username, password })  // ⚠️ "username" no "usuario"
    });

    const data = await response.json();

    if (data.success) {
      // ✅ Guardar en localStorage
        localStorage.setItem("usuarioActivo", JSON.stringify({
          id: data.idUsuario,
          nombre: data.usuario,
          tipo: data.tipo
        }));


      // ✅ Redirigir según tipo de usuario
      if (data.tipo === 'Natural') {
        window.location.href = '/Natural/perfil_usuario.html';
      } else if (data.tipo === 'Comerciante') {
        window.location.href = '/Comerciante/perfil_comerciante.html';
      } else if (data.tipo === 'PrestadorServicio') {
        window.location.href = '/PrestadorServicios/perfil_servicios.html';
      } else {
        window.location.href = '/General/index.html';
      }

    } else {
      mensajeError.textContent = data.error || 'Usuario y/o contraseña errada.';
    }
  } catch (error) {
    console.error('❌ Error al conectar con el servidor:', error);
    mensajeError.textContent = 'Error en el servidor. Intenta más tarde.';
  }
});
