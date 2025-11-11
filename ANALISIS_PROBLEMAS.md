# 🔍 Análisis Completo de Problemas del Backend

## 📋 Problemas Encontrados

### 1. **❌ Mezcla de módulos (CommonJS y ES6)**
**Ubicación:** `controllers/enviarCorreo.js`

**Problema:**
```javascript
require("dotenv").config(); // ❌ CommonJS
const nodemailer = require("nodemailer");
module.exports = enviarCorreo; // ❌ CommonJS
```

Pero el proyecto usa ES6 modules (`"type": "module"` en `package.json`).

**Solución:** Convertir a ES6:
```javascript
import dotenv from "dotenv";
import nodemailer from "nodemailer";
export const enviarCorreo = async ({ to, subject, html }) => { ... };
```

---

### 2. **❌ Rutas a archivos estáticos eliminadas**
**Ubicación:** `server.js` líneas 35-36

**Problema:**
```javascript
app.use(express.static(path.join(__dirname, 'public'))); // ❌ Carpeta 'public' eliminada
app.use("/imagen", express.static(path.join(__dirname, "public/imagen")));
```

Las carpetas `public/` y `public/imagen` fueron eliminadas. Esto causa errores al intentar servir imágenes.

**Solución:** Comentar o eliminar estas líneas (ya no hay frontend):
```javascript
// app.use(express.static(path.join(__dirname, 'public'))); // ❌ Eliminada
// app.use("/imagen", express.static(path.join(__dirname, "public/imagen"))); // ❌ Eliminada
```

---

### 3. **❌ Rutas a páginas HTML eliminadas**
**Ubicación:** `server.js` líneas 115-122

**Problema:**
```javascript
app.get('/perfil_usuario.html', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Natural/perfil_usuario.html')); // ❌ No existe
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    // ...
    res.redirect('/General/ingreso.html'); // ❌ No existe
  });
});
```

**Solución:** Eliminar estas rutas o reemplazarlas con respuestas JSON:
```javascript
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.json({ success: true, message: 'Sesión cerrada' }); // ✅ JSON en lugar de redirect
  });
});
```

---

### 4. **❌ Variable indefinida en query**
**Ubicación:** `server.js` línea 351

**Problema:**
```javascript
try {
  const [results] = await pool.query(sql); // ❌ 'sql' no está definida
  res.json(results);
} catch (err) {
```

**Solución:**
```javascript
try {
  const [results] = await pool.query(`
    SELECT
      U.Nombre AS NombreVendedor,
      C.NombreComercio,
      C.Latitud,
      C.Longitud,
      C.HoraInicio,
      C.HoraFin,
      C.DiasAtencion,
      C.Barrio
    FROM comerciante C
    INNER JOIN usuario U ON C.Comercio = U.IdUsuario
  `);
  res.json(results);
} catch (err) {
```

---

### 5. **❌ Falta de validación en `crearCredenciales`**
**Ubicación:** `controllers/credenciales.js`

**Problema:** La función recibe 3 parámetros en `server.js` pero solo espera 2:
```javascript
// En server.js línea 429:
await crearCredenciales(idUsuarioValue, idUsuarioValue, data.Correo, fotoRuta);
//                       param1            param2           param3    param4

// En credenciales.js:
export async function crearCredenciales(idUsuario, correoDestino) {
//                                       param1    param2
```

**Solución:** Corregir la llamada:
```javascript
await crearCredenciales(idUsuarioValue, data.Correo);
```

---

### 6. **❌ Middleware de sesión incorrecto**
**Ubicación:** `server.js` línea 31

**Problema:**
```javascript
app.use("/api/privado", verificarSesion); // ✅ Correcto pero...
```

Pero luego se usa:
```javascript
app.get('/api/privado/citas', async (req, res) => {
  const idUsuario = req.session?.usuario?.IdUsuario || 123; // ❌ Propiedad incorrecta
```

La sesión almacena `req.session.usuario.id`, no `IdUsuario`.

**Solución:**
```javascript
const idUsuario = req.session?.usuario?.id || null;
if (!idUsuario) return res.status(401).json({ error: 'No autenticado' });
```

---

### 7. **❌ Referencia a columna inexistente**
**Ubicación:** `server.js` línea 1816

**Problema:**
```javascript
const [comercianteRows] = await pool.query(
  'SELECT NitComercio FROM Comerciante WHERE Comercio = ?',
  [idUsuario]
);
```

Luego:
```javascript
FROM Factura f
INNER JOIN Carrito ca ON f.Carrito = ca.IdCarrito // ❌ Factura no tiene columna 'Carrito'
```

**Solución:** Revisar la estructura de `Factura`. Debería ser:
```javascript
FROM DetalleFactura df
JOIN Factura f ON df.Factura = f.IdFactura
```

---

### 8. **❌ Rutas sin implementar**
**Ubicación:** `routes/auth.js`

**Problema:** El archivo está vacío pero se importa (potencialmente) en `server.js`.

**Solución:** O implementar las rutas de autenticación o eliminar la importación.

---

### 9. **⚠️ Rutas que sirven archivos eliminados**
**Ubicación:** `server.js` líneas 115-122

**Problema:**
```javascript
app.get('/perfil_usuario.html', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Natural/perfil_usuario.html'));
});
```

Esta ruta intenta servir un archivo HTML que ya no existe.

**Solución:** Si es solo API, eliminar esta ruta.

---

### 10. **❌ Rutas de imágenes con problemas**
**Ubicación:** Todo `server.js` (múltiples ubicaciones)

**Problema:**
- Se intenta crear carpetas en `public/imagen/...` pero `public/` fue eliminada
- Las rutas relativas de imágenes pueden estar rotas

**Solución:** Cambiar a rutas absolutas en el servidor o crear una carpeta `uploads/` dedicada.

---

## 🛠️ Cambios Recomendados Orden de Prioridad

### 🔴 CRÍTICOS (Hacen fallar el servidor)
1. Convertir `enviarCorreo.js` a ES6
2. Eliminar rutas a archivos estáticos en `public/`
3. Arreglar variable `sql` no definida en `/api/talleres`
4. Corregir estructura de sesión (`usuario.id` vs `usuario.IdUsuario`)

### 🟠 IMPORTANTES (Generan errores en runtime)
5. Crear carpeta `uploads/` para guardar imágenes
6. Corregir referencias a columnas inexistentes en queries
7. Implementar o eliminar rutas de archivos HTML
8. Validar parámetros en funciones

### 🟡 MENORES (Mejoras)
9. Usar rutas absolutas en lugar de relativas
10. Agregar validación de entradas en todas las rutas
11. Mejorar manejo de errores

---

## 📝 Estructura Recomendada Final

```
/workspaces/Perfil/
├── config/
│   └── db.js ✅
├── controllers/
│   ├── credenciales.js ⚠️ (convertir a ES6)
│   └── enviarCorreo.js ❌ (convertir a ES6)
├── middlewares/
│   └── sesion.js ✅
├── routes/
│   ├── auth.js ✅ (implementar o eliminar)
│   └── protected.js (?)
├── uploads/ 📁 (CREAR: para guardar imágenes)
├── .env ✅
├── .gitignore ✅
├── server.js ⚠️ (múltiples arreglos)
├── rpm_market.sql ✅
├── package.json ✅
└── package-lock.json
```

---

## 🚀 Próximos Pasos

1. **Crear estructura de carpetas correcta**
2. **Convertir módulos a ES6**
3. **Arreglar referencias a rutas**
4. **Validar todas las queries**
5. **Probar el servidor**
