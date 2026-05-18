// 📁 public/JS/usuarioSesion.js

// 🧭 Función para cargar la info del usuario en el header (nombre y foto)
async function cargarUsuarioHeader() {
  console.log("🔵 UsuarioSesion.js - cargarUsuarioHeader iniciando...");
  
  try {
    const res = await fetch("/api/usuario-actual");
    console.log("🔵 /api/usuario-actual response status:", res.status);
    
    if (!res.ok) {
      console.log("⚠️ No autenticado (status no OK)");
      throw new Error("No autenticado");
    }

    const data = await res.json();
    console.log("✅ Datos usuario:", data);

    const nombreEl = document.getElementById("nombre-usuario");
    const fotoEl = document.getElementById("foto-usuario");

    // Extraer solo el primer nombre
    let nombreMostrar = data.nombre || "Usuario";
    if (nombreMostrar.includes(' ')) {
      nombreMostrar = nombreMostrar.split(' ')[0];
    }

    if (nombreEl) nombreEl.textContent = nombreMostrar;
    
    // Usar ruta absoluta para la foto
    if (fotoEl) {
      // Si data.foto viene con ruta, usar tal cual, sino usar imagen por defecto
      if (data.foto && data.foto.startsWith('/')) {
        fotoEl.src = data.foto;
      } else if (data.foto) {
        fotoEl.src = '/' + data.foto;
      } else {
        fotoEl.src = "/imagen/imagen_perfil.png";
      }
      console.log("✅ Foto asignada:", fotoEl.src);
    }
  } catch (error) {
    console.warn("⚠️ Error en cargarUsuarioHeader:", error.message);
  }
}

// ⚙️ Función general para verificar sesión y tipo de usuario (sin redirigir)
async function verificarSesion(usuarioEsperadoTipo = null) {
  try {
    const res = await fetch("/api/verificar-sesion");
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

// 🚀 Ejecutar automáticamente cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🔵 UsuarioSesion.js - DOMContentLoaded ejecutándose");
  
  try {
    const res = await fetch("/api/usuario-actual");
    
    if (res.ok) {
      // Hay sesión activa - cargar datos del usuario
      await cargarUsuarioHeader();
      
      // Mostrar contenedor de perfil si existe
      const perfilContainer = document.getElementById('perfil-container-detalle');
      if (perfilContainer) perfilContainer.style.display = 'block';
      
      // Ocultar botón de ingresar si existe
      const linkIngresar = document.getElementById('link-ingresar-detalle');
      if (linkIngresar) linkIngresar.style.display = 'none';
    } else {
      // No hay sesión
      const perfilContainer = document.getElementById('perfil-container-detalle');
      if (perfilContainer) perfilContainer.style.display = 'none';
      
      const linkIngresar = document.getElementById('link-ingresar-detalle');
      if (linkIngresar) linkIngresar.style.display = 'block';
    }
  } catch (error) {
    console.error("Error en inicialización de UsuarioSesion:", error);
  }
});
