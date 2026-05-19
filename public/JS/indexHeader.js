document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔵 indexHeader.js - Iniciando carga...");
  console.log("🔵 URL actual:", window.location.href);
  console.log("🔵 Cookies:", document.cookie);
  
  const header = document.querySelector("header");
  const nav = document.querySelector("nav.nav2");
  
  // 🔍 Buscar el contenedor del perfil en el header
  const headerPerfilContainer = document.getElementById('header-perfil-container');
  
  // 🔍 Buscar el enlace de "Ingresar" en el nav por ID
  const linkIngresar = document.getElementById('link-ingresar');

  // ⚠️ IMPORTANTE: Evitar redirecciones automáticas - el index.html es público
  // No redirigir al login, permitir navegación libre

  function resolverRutaApp(ruta) {
    return window.RPM_PORTABLE_PATHS?.resolveAppUrl(ruta) || ruta;
  }
  
  // Verificar sesión en el servidor
  let usuario = null;
  try {
    console.log("🔵 Verificando sesión en el servidor...");
    const res = await fetch("/api/verificar-sesion", { credentials: "include" });
    console.log("🔵 Response status:", res.status);
    console.log("🔵 Response headers:", [...res.headers.entries()]);
    if (res.ok) {
      usuario = await res.json();
      console.log("✅ Usuario encontrado:", usuario);
    } else {
      console.log("⚠️ No hay sesión activa (status no OK)");
    }
  } catch (error) {
    console.log("⚠️ Error al verificar sesión:", error.message);
  }

  if (!usuario || !usuario.id) {
    // ⛔ No hay sesión: limpiar localStorage y mostrar botón "Ingresar"
    console.log("🔵 No hay sesión - mostrando botón Ingresar");
    localStorage.removeItem("usuarioActivo");
    
    // Limpiar el contenedor del perfil en el header
    if (headerPerfilContainer) {
      headerPerfilContainer.innerHTML = '';
    }
    
    if (linkIngresar) {
      linkIngresar.style.display = "block";
    }
    console.log("✅ index.html cargado sin sesión (acceso público)");
    
    // 👉 Control del menú desplegable de Categorías (aunque no haya sesión)
    configurarMenuCategorias();
    
    return;
  }

  console.log("✅ Sesión activa:", usuario);
  
  // Actualizar localStorage con la sesión actual
  localStorage.setItem("usuarioActivo", JSON.stringify(usuario));

  // ✅ Hay sesión: OCULTAR botón "Ingresar"
  if (linkIngresar) {
    linkIngresar.remove(); // Eliminar el botón Ingresar
  }

  // 👉 Agregar botón "Perfil" en el nav
  const navPerfilButton = document.getElementById('nav-perfil-button');
  if (navPerfilButton) {
    let rutaPerfil = '/Natural/perfil_usuario.html'; // Default
    
    if (usuario.tipo === 'Comerciante') {
      rutaPerfil = '/Comerciante/perfil_comerciante.html';
    } else if (usuario.tipo === 'PrestadorServicios') {
      rutaPerfil = '/PrestadorServicios/perfil_servicios.html';
    }
    
    navPerfilButton.innerHTML = `<a href="${rutaPerfil}" class="hover:text-gray-200 transition"><i class="fas fa-user-circle mr-1"></i>Perfil</a>`;
    navPerfilButton.style.display = 'block';
  }

  // Crear el bloque de perfil en el HEADER (lado derecho, separado del logo)
  const nombreMostrar = usuario.nombreComercio || usuario.nombre || 'Usuario';
  
  // Determinar rutas según tipo de usuario
  let rutaPerfil = '/Natural/perfil_usuario.html';
  let rutaEditar = '/Natural/Editar_perfil.html';
  
  if (usuario.tipo === 'Comerciante') {
    rutaPerfil = '/Comerciante/perfil_comerciante.html';
    rutaEditar = '/Comerciante/EditarPerfil_comerciante.html';
  } else if (usuario.tipo === 'PrestadorServicios' || usuario.tipo === 'PrestadorServicio') {
    rutaPerfil = '/PrestadorServicios/perfil_servicios.html';
    rutaEditar = '/PrestadorServicios/configuracion_prestador.html';
  } else if (usuario.tipo === 'Administrador') {
    rutaPerfil = '/Administrador/panel_admin.html';
    rutaEditar = '/Administrador/panel_admin.html';
  }
  
  const perfilHTML = `
    <div class="dropdown position-relative">
      <button class="btn text-white text-decoration-none d-flex align-items-center gap-2 p-0 bg-transparent border-0" 
              type="button"
              id="perfilDropdown"
              style="cursor: pointer;">
        <img id="foto-usuario" 
             src="${window.RPM_PORTABLE_PATHS?.normalizeImageUrl(usuario.foto) || '/image/imagen_perfil.png'}" 
             alt="Usuario" 
             class="rounded-circle border border-white border-2"
             style="width: 50px; height: 50px; object-fit: cover;"/>
        <div class="d-flex flex-column align-items-start text-start">
          <span class="fw-bold" style="font-size: 1rem;">${nombreMostrar}</span>
          <small class="opacity-75" style="font-size: 0.85rem;">${usuario.tipo || ''}</small>
        </div>
        <i class="fas fa-chevron-down ms-2"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow position-absolute" id="menuDropdownPerfil" style="display: none; right: 0; top: 100%; margin-top: 0.5rem; z-index: 1050;">
        <li>
          <a class="dropdown-item" href="${rutaPerfil}">Ver Perfil</a>
        </li>
        <li>
          <a class="dropdown-item" href="${rutaEditar}">Configurar Perfil</a>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <a class="dropdown-item text-danger" href="#" id="cerrarSesion">Cerrar sesión</a>
        </li>
      </ul>
    </div>
  `;

  // Insertar perfil en el contenedor del header (lado derecho)
  if (headerPerfilContainer) {
    headerPerfilContainer.innerHTML = perfilHTML;
    console.log("✅ Perfil agregado al header (lado derecho)");
    
    // Configurar dropdown con eventos manuales
    setTimeout(() => {
      const dropdownButton = document.getElementById('perfilDropdown');
      const dropdownMenu = document.getElementById('menuDropdownPerfil');
      
      if (dropdownButton && dropdownMenu) {
        // Toggle dropdown al hacer click
        dropdownButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const isVisible = dropdownMenu.style.display === 'block';
          dropdownMenu.style.display = isVisible ? 'none' : 'block';
          console.log("🔵 Dropdown toggled:", !isVisible);
        });
        
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
          if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
          }
        });
        
        console.log("✅ Dropdown eventos configurados");
      }
      
      // Configurar cerrar sesión DESPUÉS de insertar el HTML
      const btnCerrarSesion = document.getElementById("cerrarSesion");
      if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", async (e) => {
          e.preventDefault();
          
          console.log("🚪 Cerrando sesión...");
          
          try {
            // Llamar al endpoint de logout en el servidor
            await fetch("/logout", { method: "GET", credentials: "include" });
            console.log("✅ Logout en servidor completado");
          } catch (error) {
            console.error("⚠️ Error al cerrar sesión en servidor:", error);
          }
          
          // Limpiar localStorage
          localStorage.clear();
          sessionStorage.clear();
          console.log("✅ localStorage y sessionStorage limpiados");
          
          // Redirigir al login
          window.location.href = resolverRutaApp("/General/Ingreso.html");
        });
        console.log("✅ Event listener de cerrar sesión agregado");
      } else {
        console.error("❌ No se encontró el botón de cerrar sesión");
      }
    }, 100);
  } else {
    console.error("❌ No se encontró el contenedor de perfil en el header");
  }

  // 👉 Ajustar navegación según tipo de usuario
  ajustarNavegacionSegunUsuario(usuario);
  
  // 👉 Control del menú desplegable de Categorías
  configurarMenuCategorias();
});

/**
 * Ajusta la navegación según el tipo de usuario
 */
function ajustarNavegacionSegunUsuario(usuario) {
  const categoriaContainer = document.getElementById('btnCategorias')?.parentElement;
  
  if (usuario && usuario.tipo === 'Comerciante' && categoriaContainer) {
    // Reemplazar Categorías por Inicio para comerciantes
    categoriaContainer.innerHTML = `<a href="${resolverRutaApp('/Comerciante/perfil_comerciante.html')}" class="hover:text-gray-200 transition">Inicio</a>`;
    console.log('✅ Navegación ajustada para comerciante');
  }
}

/**
 * Configura el menú desplegable de Categorías
 */
function configurarMenuCategorias() {
  const btnCategorias = document.getElementById("btnCategorias");
  const menuCategorias = document.getElementById("menuCategorias");

  if (btnCategorias && menuCategorias) {
    btnCategorias.addEventListener("click", (e) => {
      e.stopPropagation();
      menuCategorias.classList.toggle("hidden");
    });

    // Cierra el menú si se hace clic fuera
    document.addEventListener("click", (e) => {
      if (!menuCategorias.contains(e.target) && !btnCategorias.contains(e.target)) {
        menuCategorias.classList.add("hidden");
      }
    });
  }
}