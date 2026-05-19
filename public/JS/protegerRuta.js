/**
 * 🔒 Middleware para proteger rutas que requieren autenticación
 * Si no hay sesión activa, redirige al login
 * 
 * Uso: Incluir este script al INICIO del <head> de las páginas protegidas:
 * <script src="../JS/protegerRuta.js"></script>
 */

function resolverRutaApp(ruta) {
  return window.RPM_PORTABLE_PATHS?.resolveAppUrl(ruta) || ruta;
}

(async function() {
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  // Primera verificación: localStorage
  if (!usuarioActivo || !usuarioActivo.id) {
    console.warn("⚠️ No hay sesión en localStorage. Redirigiendo al login...");
    window.location.href = resolverRutaApp("/General/Ingreso.html");
    return;
  }

  // Segunda verificación: verificar con el servidor
  try {
    const response = await fetch("/api/verificar-sesion", { credentials: "include" });
    const data = await response.json();
    
    if (!data.activa) {
      console.warn("⚠️ Sesión no válida en el servidor. Redirigiendo al login...");
      localStorage.removeItem("usuarioActivo");
      window.location.href = resolverRutaApp("/General/Ingreso.html");
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    // Si hay error de conexión, permitir continuar (offline)
  }
})();
