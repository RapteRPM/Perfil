# 🚗 RPM Market - Frontend

Frontend del marketplace de repuestos y servicios automotrices.

## 📋 Descripción

Este es el frontend del proyecto RPM Market, separado del backend para mejor escalabilidad y mantenimiento. El backend se encuentra en el repositorio [PERFIL-FRONTEND](https://github.com/RapteRPM/PERFIL-FRONTEND).

## 🚀 Configuración

### Prerrequisitos

- Node.js (v14 o superior)
- Backend RPM Market corriendo en `http://localhost:3000`

### Instalación

```bash
npm install
```

### Ejecución

#### Modo Desarrollo
```bash
npm run dev
```
El servidor se iniciará en `http://localhost:5500`

#### Modo Producción
```bash
npm start
```

### Usando Live Server de VS Code

También puedes usar la extensión Live Server de VS Code:
1. Abre el archivo `index.html`
2. Click derecho → "Open with Live Server"

## 🔧 Configuración del Backend

El frontend se conecta al backend mediante el archivo `public/JS/api-config.js`.

**URL del Backend por defecto:** `http://localhost:3000`

Para cambiar la URL del backend, edita el archivo:
```javascript
// public/JS/api-config.js
const API_BASE_URL = 'http://tu-servidor-backend:3000';
```

## 📁 Estructura del Proyecto

```
Perfil/
├── index.html                    # Página de inicio
├── public/
│   ├── General/                  # Páginas públicas
│   │   ├── index.html
│   │   ├── Ingreso.html
│   │   ├── Registro.html
│   │   └── ...
│   ├── Comerciante/             # Panel del comerciante
│   ├── Natural/                 # Panel del usuario natural
│   ├── PrestadorServicios/      # Panel del prestador
│   ├── JS/                      # Scripts JavaScript
│   │   ├── api-config.js        # ⭐ Configuración de API
│   │   ├── app.js
│   │   └── ...
│   └── Imagen/                  # Assets e imágenes
└── package.json
```

## 🔗 Conexión con el Backend

### Archivos Actualizados

Los siguientes archivos ya están configurados para conectarse con el backend externo:

- ✅ `public/JS/api-config.js` - Configuración central de la API
- ✅ `public/JS/app.js` - Login
- ✅ `public/JS/UsuarioSesion.js` - Sesión de usuario
- ✅ `public/JS/perfil_usuario.js` - Perfil
- ✅ `public/JS/centroAyuda.js` - Centro de ayuda
- ✅ `public/JS/registro.js` - Registro
- ✅ `public/JS/mapa.js` - Mapa de talleres

### Archivos Pendientes de Actualizar

Los siguientes archivos aún necesitan ser actualizados para usar `api-config.js`:

**Comerciante:**
- [ ] `public/JS/Comerciante/publicacion.js`
- [ ] `public/JS/Comerciante/registro_publicacion.js`
- [ ] `public/JS/Comerciante/historialVentas.js`
- [ ] `public/JS/Comerciante/editar_publicacion.js`
- [ ] `public/JS/Comerciante/ControlAgenda.js`
- [ ] `public/JS/Comerciante/editar_perfilComerciante.js`
- [ ] `public/JS/Comerciante/dashboard_comerciante.js`

**Natural:**
- [ ] `public/JS/Natural/*` (todos los archivos del usuario natural)

**Prestador:**
- [ ] `public/JS/Prestador/*` (todos los archivos del prestador)

**General:**
- [ ] `public/JS/RecuperarContraseña.js`
- [ ] `public/JS/cambiarcontraseña.js`
- [ ] `public/JS/market_gruas.js`
- [ ] `public/JS/Visualizacion_publicaciones.js`

### Patrón de Actualización

Para actualizar cualquier archivo JS, sigue este patrón:

**Antes:**
```javascript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Después:**
```javascript
import { API_CONFIG, postAPI } from './api-config.js';

const response = await postAPI(API_CONFIG.RUTA.ENDPOINT, data);
```

O usando `fetchAPI` para más control:
```javascript
import { API_CONFIG, fetchAPI } from './api-config.js';

const response = await fetchAPI(API_CONFIG.RUTA.ENDPOINT, {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## 🌐 CORS

El backend debe tener CORS habilitado para aceptar peticiones desde el frontend:

```javascript
// Backend: server.js
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5500', // URL del frontend
  credentials: true // Permitir cookies/sesiones
}));
```

## 📝 Archivos HTML

Asegúrate de que todos los archivos HTML que usen módulos JS tengan el tipo correcto:

```html
<script type="module" src="../JS/app.js"></script>
```

## 🐛 Solución de Problemas

### Error: CORS blocked
- Verifica que el backend tenga CORS configurado
- Verifica que la URL del backend en `api-config.js` sea correcta

### Error: Network request failed
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Verifica que no haya firewall bloqueando las conexiones

### Error: Cannot use import outside a module
- Asegúrate de que el script tenga `type="module"` en el HTML:
  ```html
  <script type="module" src="./script.js"></script>
  ```

## 📦 Deployment

Para desplegar el frontend en producción:

1. Actualiza `API_BASE_URL` en `api-config.js` con la URL del backend en producción
2. Sube los archivos a tu hosting (Netlify, Vercel, GitHub Pages, etc.)
3. Asegúrate de que el backend acepte peticiones desde el dominio del frontend

## 👥 Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Haz commit de tus cambios: `git commit -m 'Agrega nueva funcionalidad'`
3. Sube a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📄 Licencia

ISC

## 🔗 Enlaces

- [Backend Repository](https://github.com/RapteRPM/PERFIL-FRONTEND)
- [Documentación de la API](https://github.com/RapteRPM/PERFIL-FRONTEND/blob/backend/README.md)
