# 📝 Instrucciones para Configurar el Backend

Este documento contiene las instrucciones para configurar el backend en el repositorio `PERFIL-FRONTEND` (rama `backend`).

## 🔧 Cambios Necesarios en el Backend

### 1. Instalar CORS

```bash
cd PERFIL-FRONTEND
npm install cors
```

### 2. Actualizar server.js

Agrega las siguientes líneas al inicio del archivo `server.js`:

```javascript
// ===============================
// 📦 Importaciones
// ===============================
import express from 'express';
import cors from 'cors';  // ⬅️ AGREGAR ESTO
// ... resto de imports

const app = express();
const port = 3000;

// ===============================
// 🌐 Configuración CORS
// ===============================
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // URLs del frontend
  credentials: true, // Permitir envío de cookies/sesiones
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===============================
// 🔐 Configuración de sesiones
// ===============================
app.use(session({
  secret: 'clave-secreta-rpm',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hora
    httpOnly: true,
    sameSite: 'lax', // ⬅️ IMPORTANTE para CORS
    secure: false // ⬅️ true solo en HTTPS
  },
}));

// ⚠️ ELIMINAR estas líneas (ya no servimos archivos estáticos):
// app.use(express.static(path.join(__dirname, 'public')));  // ❌ ELIMINAR
// app.use("/imagen", express.static(...));                   // ❌ ELIMINAR

// ⚠️ ELIMINAR rutas de páginas HTML (solo mantenemos APIs):
// app.get('/perfil_usuario.html', ...);  // ❌ ELIMINAR
// app.get('/dashboard_comerciante.html', ...);  // ❌ ELIMINAR
// etc.
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del backend:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=rpm_market
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development

# Sesión
SESSION_SECRET=clave-secreta-rpm

# CORS
FRONTEND_URL=http://localhost:5500
```

### 4. Actualizar config/db.js

Modifica el archivo para no bloquear el inicio:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'rpm_market',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ⚠️ NO HACER await aquí, solo exportar el pool
// El servidor probará la conexión cuando la necesite

export default pool;
```

### 5. Probar Conexión al Iniciar

En `server.js`, al final antes de `app.listen()`:

```javascript
// ===============================
// 🚀 Iniciar servidor
// ===============================
app.listen(port, async () => {
  console.log(`🚀 Servidor escuchando en: http://localhost:${port}`);
  
  // Probar conexión a la base de datos
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos con ID ' + connection.threadId);
    connection.release();
  } catch (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    console.warn('⚠️  El servidor está corriendo pero sin conexión a la BD');
  }
});
```

### 6. Eliminar Carpeta public/

Si la carpeta `public/` aún existe en el backend, elimínala:

```bash
cd PERFIL-FRONTEND
rm -rf public/
```

### 7. Mantener Carpeta de Uploads

Crea una carpeta para los archivos subidos (imágenes, etc.):

```bash
mkdir -p uploads/productos
mkdir -p uploads/usuarios
mkdir -p uploads/servicios
```

Actualiza las rutas de multer en `server.js`:

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/productos/'); // ⬅️ Nueva ruta
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
```

Y sirve las imágenes con una ruta API:

```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 8. Actualizar package.json

```json
{
  "name": "rpm-market-backend",
  "version": "1.0.0",
  "description": "Backend API del marketplace RPM Market",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "body-parser": "^2.2.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "exceljs": "^4.4.0",
    "express": "^5.1.0",
    "express-session": "^1.18.2",
    "multer": "^2.0.2",
    "mysql2": "^3.14.1",
    "nodemailer": "^7.0.10"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🚀 Ejecutar el Backend

```bash
# En el repositorio PERFIL-FRONTEND
cd PERFIL-FRONTEND
npm install
npm start
```

El backend debería iniciarse en `http://localhost:3000`

## ✅ Verificación

Para verificar que el backend está funcionando correctamente:

```bash
# Probar endpoint de salud
curl http://localhost:3000/api/verificar-sesion
```

Deberías recibir una respuesta JSON.

## 🔗 URLs Importantes

- **Backend API:** `http://localhost:3000`
- **Frontend:** `http://localhost:5500`
- **Base de Datos:** `localhost:3306`

## 📝 Checklist

- [ ] CORS instalado y configurado
- [ ] Líneas de `express.static(public)` eliminadas
- [ ] Rutas de HTML eliminadas (solo APIs)
- [ ] Variables de entorno configuradas
- [ ] Carpeta `uploads/` creada
- [ ] Servidor inicia sin errores
- [ ] Base de datos conecta correctamente
- [ ] Frontend puede hacer peticiones al backend

## 🐛 Problemas Comunes

### Error: "Access-Control-Allow-Origin"
✅ Solución: Verifica que CORS esté configurado correctamente con `credentials: true`

### Error: "Session undefined"
✅ Solución: Verifica que la cookie tenga `sameSite: 'lax'` y que el frontend use `credentials: 'include'`

### Error: "ECONNREFUSED 3306"
✅ Solución: Inicia MySQL/MariaDB con `sudo service mysql start`

### Error: "Cannot find module 'cors'"
✅ Solución: Ejecuta `npm install cors`
