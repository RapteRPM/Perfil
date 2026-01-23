// ===============================
// 🔧 Configuración de la API Backend
// ===============================

// URL del backend en Codespaces
const API_BASE_URL = 'https://miniature-zebra-pjrxg4x6v7g52r565-3000.app.github.dev';

console.log('🔧 API Backend configurada en:', API_BASE_URL);

// Re-exportar para uso directo
export const API_URL = API_BASE_URL;

// Configuración de endpoints
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  // Endpoints de autenticación
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/logout',
    VERIFICAR_SESION: '/api/verificar-sesion',
    USUARIO_ACTUAL: '/api/usuario-actual'
  },
  
  // Endpoints de usuarios
  USUARIOS: {
    BASE: '/api/usuarios',
    POR_CEDULA: (documento) => `/api/usuarios/cedula/${documento}`,
    ACTUALIZAR_CONTRASENA: (id) => `/api/usuarios/${id}/contrasena`
  },
  
  // Endpoints de publicaciones
  PUBLICACIONES: {
    BASE: '/api/publicaciones',
    DETALLE: (id) => `/api/publicaciones/${id}`,
    PUBLICAR: '/api/publicar',
    CATEGORIAS: '/api/categorias'
  },
  
  // Endpoints de historial
  HISTORIAL: {
    BASE: '/api/historial',
    VENTAS: '/api/historial-ventas',
    EXCEL: '/api/historial/excel',
    VENTAS_EXCEL: '/api/historial-ventas/excel',
    ESTADO: (id) => `/api/historial/estado/${id}`,
    ELIMINAR: (idFactura) => `/api/historial/eliminar/${idFactura}`,
    CONFIRMAR_RECIBIDO: '/api/confirmar-recibido'
  },
  
  // Endpoints de talleres y servicios
  TALLERES: {
    BASE: '/api/talleres'
  },
  
  // Endpoints de agenda
  AGENDA: {
    COMERCIANTE: '/api/agenda/comerciante',
    GRUA: '/api/agenda/grua'
  }
};

// ===============================
// 🌐 Helper para hacer peticiones
// ===============================

/**
 * Realiza una petición fetch con configuración predeterminada
 * @param {string} endpoint - Ruta del endpoint (puede usar API_CONFIG)
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include', // Importante para mantener sesiones
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  // Combinar opciones
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    throw error;
  }
}

/**
 * Realiza una petición GET
 * @param {string} endpoint 
 * @returns {Promise<any>}
 */
export async function getAPI(endpoint) {
  const response = await fetchAPI(endpoint, { method: 'GET' });
  return response.json();
}

/**
 * Realiza una petición POST
 * @param {string} endpoint 
 * @param {object} data 
 * @returns {Promise<any>}
 */
export async function postAPI(endpoint, data) {
  const response = await fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}

/**
 * Realiza una petición PUT
 * @param {string} endpoint 
 * @param {object} data 
 * @returns {Promise<any>}
 */
export async function putAPI(endpoint, data) {
  const response = await fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.json();
}

/**
 * Realiza una petición DELETE
 * @param {string} endpoint 
 * @returns {Promise<any>}
 */
export async function deleteAPI(endpoint) {
  const response = await fetchAPI(endpoint, { method: 'DELETE' });
  return response.json();
}

/**
 * Realiza una petición con FormData (para archivos)
 * @param {string} endpoint 
 * @param {FormData} formData 
 * @returns {Promise<any>}
 */
export async function postFormDataAPI(endpoint, formData) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData
    // No establecer Content-Type para FormData
  });
  
  return response.json();
}

// Exportar la URL base para casos especiales
export { API_BASE_URL };
