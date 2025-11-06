//Uso en cada página según el tipo- estos codigos van en cada archivo js 

//1. Página del comerciante//

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await verificarSesion("Comerciante");
  if (!usuario) return; // Redirige automáticamente si no es comerciante

  // Aquí tu código específico para el comerciante
  cargarHistorialVentas();
});

//2. Página de usuario natural//
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await verificarSesion("Natural");
  if (!usuario) return;

  // Código específico para usuario natural
  cargarCarritoCompras();
});
//3. Página de prestador de servicios//
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await verificarSesion("Prestador");
  if (!usuario) return;

  // Código específico para prestador de servicios
  cargarAgendaServicios();
});
