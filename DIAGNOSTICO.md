# 🔍 Diagnóstico de Conexión Frontend-Backend

## ✅ Estado del Backend

El backend **SÍ está corriendo** en `http://localhost:3000` y responde a las peticiones.

### Pruebas Realizadas:

```bash
# ✅ Endpoint de verificación de sesión - FUNCIONA
curl http://localhost:3000/api/verificar-sesion
# Respuesta: {"activa":false}

# ❌ Endpoint de login - ERROR INTERNO
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin", "password":"test123"}'
# Respuesta: {"error":"Error interno del servidor"}

# ❌ Endpoint de categorías - ERROR INTERNO
curl http://localhost:3000/api/categorias
# Respuesta: {"error":"Error al obtener las categorías."}
```

---

## 🐛 Problema Identificado

El backend está corriendo pero tiene **errores internos**, probablemente relacionados con:
1. **Base de datos no conectada** (MySQL/MariaDB no está corriendo)
2. **Credenciales de BD incorrectas**
3. **Tablas no creadas** en la base de datos

---

## 📋 Preguntas para el Otro Repositorio

Copia y pega esto en el chat del repositorio `PERFIL-FRONTEND`:

```
El backend está corriendo en http://localhost:3000 pero arroja errores internos. 

Cuando pruebo los endpoints obtengo:
- /api/verificar-sesion → Funciona ✅
- /api/login → {"error":"Error interno del servidor"} ❌
- /api/categorias → {"error":"Error al obtener las categorías."} ❌

Por favor verifica:

1. ¿MySQL/MariaDB está corriendo? Ejecuta:
   sudo service mysql status
   
2. Si no está corriendo, inícialo:
   sudo service mysql start

3. ¿La base de datos 'rpm_market' existe?
   mysql -u root -p -e "SHOW DATABASES;"

4. ¿Las tablas están creadas? 
   mysql -u root -p rpm_market -e "SHOW TABLES;"

5. Si no están, importa el SQL:
   mysql -u root -p < rpm_market.sql

6. Verifica los logs del servidor para ver el error exacto. 
   ¿Qué dice la consola donde está corriendo "node server.js"?

7. Verifica que el archivo config/db.js tenga las credenciales correctas:
   - host: localhost
   - user: root
   - password: [tu contraseña]
   - database: rpm_market
```

---

## 🔧 Soluciones Posibles

### Opción 1: Iniciar MySQL

```bash
# En el repositorio PERFIL-FRONTEND
sudo service mysql start
sudo service mysql status
```

### Opción 2: Crear la Base de Datos

```bash
# En el repositorio PERFIL-FRONTEND
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rpm_market;"
mysql -u root -p rpm_market < rpm_market.sql
```

### Opción 3: Verificar Logs del Backend

En el terminal donde corre el backend, deberías ver mensajes de error específicos. Comparte esos logs.

---

## 🧪 Pruebas desde el Frontend

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Probar conexión
fetch('http://localhost:3000/api/verificar-sesion', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Probar login
fetch('http://localhost:3000/api/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    username: 'admin', 
    password: 'tu_contraseña' 
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📊 Checklist

- [x] Backend está corriendo en :3000
- [x] CORS está configurado (verificar-sesion funciona)
- [ ] MySQL está corriendo
- [ ] Base de datos existe
- [ ] Tablas están creadas
- [ ] Credenciales de BD son correctas
- [ ] Login funciona
- [ ] Endpoints devuelven datos

---

## 🎯 Próximo Paso

**En el backend (PERFIL-FRONTEND):**
1. Verifica que MySQL esté corriendo
2. Importa el archivo `rpm_market.sql`
3. Revisa los logs del servidor
4. Comparte el error exacto que aparece

Una vez que MySQL esté funcionando, todo debería conectarse automáticamente.
