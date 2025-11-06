// ===============================
// 📦 Importaciones
// ===============================
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import ExcelJS from 'exceljs';
import fs from 'fs';
import axios from 'axios';
import multer from 'multer';
import pool from './config/db.js'; // ✅ usamos pool, import moderno
import { crearCredenciales } from './controllers/credenciales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Configuración general
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// ===============================
// 🔐 Configuración de sesiones
// ===============================
app.use(
  session({
    secret: 'clave-secreta-rpm',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hora
      httpOnly: true,
    },
  })
);

// Evitar caché en páginas protegidas
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


// ===============================
// 🔑 Login
// ===============================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body; // ✅ nombres iguales a los del frontend

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const query = `
      SELECT c.*, u.TipoUsuario
      FROM Credenciales c
      JOIN Usuario u ON u.IdUsuario = c.Usuario
      WHERE TRIM(c.NombreUsuario) = TRIM(?)
    `;

    // 👇 Aquí usamos pool.query() con await
    const [results] = await pool.query(query, [username]);

    if (results.length === 0) {
      console.warn("⚠️ Usuario no encontrado:", username);
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const usuario = results[0];
    console.log("🧠 Usuario encontrado:", usuario);

    if (usuario.Contrasena !== password) {
      console.warn("⚠️ Contraseña incorrecta para:", username);
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Guardar sesión
    req.session.usuario = {
      id: usuario.Usuario,
      nombre: usuario.NombreUsuario,
      tipo: usuario.TipoUsuario || "Natural"
    };

    console.log("✅ Usuario autenticado:", req.session.usuario);
    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      tipo: req.session.usuario.tipo,
      usuario: req.session.usuario.nombre,
      idUsuario: req.session.usuario.id
    });

  } catch (err) {
    console.error("❌ Error en la consulta SQL:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ===============================
// 👤 Ruta para obtener datos del usuario actual
// ===============================
app.get('/api/usuario-actual', verificarSesion, async (req, res) => {
  const usuarioSesion = req.session.usuario;
  if (!usuarioSesion) {
    return res.status(401).json({ error: "No hay usuario activo" });
  }

  try {
    // 🔍 Obtenemos los datos del usuario
    const [userRows] = await pool.query(
      `SELECT u.IdUsuario, u.TipoUsuario, u.Nombre, u.Documento, u.FotoPerfil
       FROM Usuario u
       INNER JOIN Credenciales c ON c.Usuario = u.IdUsuario
       WHERE u.IdUsuario = ?`,
      [usuarioSesion.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = userRows[0];
    let nombreMostrar = user.Nombre;

    // 🏪 Si es comerciante, obtener nombre del comercio
    if (user.TipoUsuario === "Comerciante") {
      const [comercioRows] = await pool.query(
        `SELECT NombreComercio FROM Comerciante WHERE Comercio = ?`,
        [usuarioSesion.id]
      );
      if (comercioRows.length > 0) {
        nombreMostrar = comercioRows[0].NombreComercio;
      }
    }

    // 🖼️ Ruta de la imagen
    const tipo = user.TipoUsuario;
    const documento = user.Documento;
    const fotoGuardada = user.FotoPerfil;

    // Ruta absoluta
    const rutaCarpeta = path.join(__dirname, 'public', 'Imagen', tipo, documento.toString());
    let fotoRutaFinal = '/image/imagen_perfil.png'; // por defecto

    if (fs.existsSync(rutaCarpeta)) {
      const archivos = fs.readdirSync(rutaCarpeta);
      const archivoFoto = archivos.find(
        f => f.includes(fotoGuardada) || f.match(/\.(jpg|jpeg|png|webp)$/i)
      );
      if (archivoFoto) {
        fotoRutaFinal = `/Imagen/${tipo}/${documento}/${archivoFoto}`;
      }
    } else {
      console.warn(`⚠️ Carpeta de usuario no encontrada: ${rutaCarpeta}`);
    }

    // ✅ Respuesta al frontend
    res.json({
      id: user.IdUsuario,
      nombre: nombreMostrar,
      tipo: tipo,
      foto: fotoRutaFinal,
    });

  } catch (err) {
    console.error("❌ Error al obtener usuario actual:", err);
    res.status(500).json({ error: "Error al obtener usuario actual" });
  }
});

// ===============================
// 🚪 Logout
// ===============================
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error al cerrar sesión:', err);
      return res.status(500).send('Error al cerrar sesión');
    }

    // 🧹 Limpia cookies de sesión para mayor seguridad
    res.clearCookie('connect.sid', { path: '/' });

    // 🔄 Redirige al login
    res.redirect('/General/ingreso.html');
  });
});

// ===============================
// 🧠 Verificar sesión activa
// ===============================
app.get('/api/verificar-sesion', (req, res) => {
  const sesionActiva = !!req.session?.usuario;
  res.json({ activa: sesionActiva });
});

// ===============================
// 🌐 Middleware de protección de rutas
// ===============================
function verificarSesion(req, res, next) {
  if (!req.session?.usuario) {
    console.warn('⚠️ Intento de acceso sin sesión activa');
    return res.redirect('/General/ingreso.html');
  }
  next();
}

// ===============================
// 🌐 Rutas protegidas
// ===============================
app.get('/perfil_usuario.html', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Natural/perfil_usuario.html'));
});

app.get('/dashboard_comerciante.html', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Comerciante/dashboard_comerciante.html'));
});

app.get('/Historial_ventas.html', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Comerciante/Historial_ventas.html'));
});

// ===============================
// 🏁 Iniciar servidor
// ===============================
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en: http://localhost:${port}/General/index.html`);
});

// ----------------------
// CONSULTAR HISTORIAL DE COMPRAS - USUARIO NATURAL
// ----------------------

// HISTORIAL DE COMPRAS - CONSULTA
// ===============================
app.get('/api/historial', async (req, res) => {
  const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;

  let query = `
      SELECT 
          pub.NombreProducto AS producto,
          cat.NombreCategoria AS categoria,
          f.FechaCompra AS fecha,
          f.TotalPago AS precio,
          f.MetodoPago AS metodoPago,
          f.Estado AS estado
      FROM Factura f
      JOIN Carrito ca ON f.Carrito = ca.IdCarrito
      JOIN Publicacion pub ON ca.Publicacion = pub.IdPublicacion
      JOIN Categoria cat ON pub.Categoria = cat.IdCategoria
      WHERE 1 = 1
  `;

  const params = [];

  if (fechaInicio) {
    query += ' AND f.FechaCompra >= ?';
    params.push(fechaInicio);
  }
  if (fechaFin) {
    query += ' AND f.FechaCompra <= ?';
    params.push(fechaFin);
  }
  if (tipoProducto) {
    query += ' AND LOWER(cat.NombreCategoria) = ?';
    params.push(tipoProducto.toLowerCase());
  }

  if (ordenPrecio === 'asc') query += ' ORDER BY f.TotalPago ASC';
  else if (ordenPrecio === 'desc') query += ' ORDER BY f.TotalPago DESC';

  try {
    const [results] = await pool.query(query, params);

    if (results.length === 0) {
      console.warn('⚠️ Sin resultados en historial.');
    } else {
      console.log(`✅ Resultados de historial: ${results.length}`);
    }

    res.json(results);
  } catch (err) {
    console.error('❌ Error en la consulta de historial:', err);
    res.status(500).json({ error: 'Error en la consulta de historial' });
  }
});

// ===============================
//  DESCARGAR EXCEL HISTORIAL COMPRAS - USUARIO NATURAL
// ===============================
app.get('/api/historial/excel', async (req, res) => {
  const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;

  let query = `
      SELECT 
          f.IdFactura,
          pub.NombreProducto AS producto,
          cat.NombreCategoria AS categoria,
          f.FechaCompra AS fecha,
          f.TotalPago AS total,
          f.MetodoPago AS metodoPago,
          f.Estado AS estado
      FROM Factura f
      JOIN Carrito ca ON f.Carrito = ca.IdCarrito
      JOIN Publicacion pub ON ca.Publicacion = pub.IdPublicacion
      JOIN Categoria cat ON pub.Categoria = cat.IdCategoria
      WHERE 1 = 1
  `;

  const params = [];

  if (fechaInicio) {
    query += ' AND f.FechaCompra >= ?';
    params.push(fechaInicio);
  }
  if (fechaFin) {
    query += ' AND f.FechaCompra <= ?';
    params.push(fechaFin);
  }
  if (tipoProducto) {
    query += ' AND LOWER(cat.NombreCategoria) = ?';
    params.push(tipoProducto.toLowerCase());
  }

  if (ordenPrecio === 'asc') query += ' ORDER BY f.TotalPago ASC';
  else if (ordenPrecio === 'desc') query += ' ORDER BY f.TotalPago DESC';

  try {
    const [results] = await pool.query(query, params);

    if (results.length === 0) {
      console.warn('⚠️ No hay datos para generar el Excel.');
      return res.status(404).send('No hay datos para generar el Excel.');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Compras');

    worksheet.columns = [
      { header: '#', key: 'n', width: 5 },
      { header: 'ID Factura', key: 'IdFactura', width: 10 },
      { header: 'Producto', key: 'producto', width: 25 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Fecha de Compra', key: 'fecha', width: 20 },
      { header: 'Total Pagado', key: 'total', width: 15 },
      { header: 'Método de Pago', key: 'metodoPago', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    results.forEach((row, i) => {
      worksheet.addRow({
        n: i + 1,
        IdFactura: row.IdFactura,
        producto: row.producto,
        categoria: row.categoria,
        fecha: row.fecha?.toISOString().split('T')[0],
        total: Number(row.total),
        metodoPago: row.metodoPago,
        estado: row.estado
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=historial_compras.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ Error en consulta Excel:', err);
    res.status(500).send('Error al generar Excel');
  }
});

// ==============================
//  HISTORIAL DE VENTAS - USUARIO COMERCIANTE
// ==============================
app.get('/api/historial-ventas', async (req, res) => {
  const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;
  const usuario = req.session.usuario;

  if (!usuario || usuario.tipo !== 'Comerciante') {
    return res.status(403).json({ error: 'Acceso no autorizado. Solo disponible para comerciantes.' });
  }

  let query = `
    SELECT 
      f.IdFactura AS idVenta,
      p.NombreProducto AS producto,
      c.NombreCategoria AS categoria,
      u.Nombre AS comprador,
      f.FechaCompra AS fecha,
      df.Cantidad AS cantidad,
      df.Total AS total,
      f.MetodoPago AS metodoPago,
      f.Estado AS estado
    FROM DetalleFactura df
    JOIN Factura f ON df.Factura = f.IdFactura
    JOIN Producto p ON df.Producto = p.IdProducto
    JOIN Categoria c ON p.IdCategoria = c.IdCategoria
    LEFT JOIN Usuario u ON f.Usuario = u.IdUsuario
    WHERE p.IdComerciante = ?
  `;

  const params = [usuario.id];

  if (fechaInicio) {
    query += ' AND f.FechaCompra >= ?';
    params.push(fechaInicio);
  }

  if (fechaFin) {
    query += ' AND f.FechaCompra <= ?';
    params.push(fechaFin);
  }

  if (tipoProducto) {
    query += ' AND LOWER(c.NombreCategoria) = ?';
    params.push(tipoProducto.toLowerCase());
  }

  if (ordenPrecio === 'asc') query += ' ORDER BY df.Total ASC';
  else if (ordenPrecio === 'desc') query += ' ORDER BY df.Total DESC';

  try {
    const [results] = await pool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('❌ Error en historial ventas:', err);
    res.status(500).json({ error: 'Error en la consulta de historial de ventas' });
  }
});


// ==============================
// HISTORIAL DE VENTAS (EXCEL) - COMERCIANTE
// ==============================
app.get('/api/historial-ventas/excel', async (req, res) => {
  const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;
  const usuario = req.session.usuario;

  if (!usuario || usuario.tipo !== 'Comerciante') {
    return res.status(403).send('Acceso no autorizado.');
  }

  const idComerciante = usuario.id; // ID del comerciante de la sesión
  const params = [idComerciante];

let query = `
  SELECT 
    f.IdFactura AS idVenta,
    p.NombreProducto AS producto,
    c.NombreCategoria AS categoria,
    u.Nombre AS comprador,
    f.FechaCompra AS fecha,
    df.Cantidad AS cantidad,
    df.Total AS total,
    f.MetodoPago AS metodoPago,
    f.Estado AS estado
  FROM DetalleFactura df
  JOIN Factura f ON df.Factura = f.IdFactura
  JOIN Producto p ON df.Producto = p.IdProducto
  JOIN Publicacion pub ON pub.IdPublicacion = p.PublicacionComercio
  JOIN Categoria c ON p.IdCategoria = c.IdCategoria
  LEFT JOIN Usuario u ON f.Usuario = u.IdUsuario
  WHERE pub.Comerciante = ?
`;

  // 🔹 Filtros opcionales
  if (fechaInicio) {
    query += ' AND f.FechaCompra >= ?';
    params.push(fechaInicio);
  }
  if (fechaFin) {
    query += ' AND f.FechaCompra <= ?';
    params.push(fechaFin);
  }
  if (tipoProducto) {
    query += ' AND LOWER(c.NombreCategoria) = ?';
    params.push(tipoProducto.toLowerCase());
  }

  // 🔹 Orden
  if (ordenPrecio === 'asc') query += ' ORDER BY df.Total ASC';
  else if (ordenPrecio === 'desc') query += ' ORDER BY df.Total DESC';

  try {
    const [results] = await pool.query(query, params);

    if (results.length === 0) {
      return res.json({ success: false, mensaje: 'No hay datos para generar el Excel.' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial Ventas');

    worksheet.columns = [
      { header: '#', key: 'n', width: 5 },
      { header: 'ID Venta', key: 'idVenta', width: 10 },
      { header: 'Producto', key: 'producto', width: 25 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Comprador', key: 'comprador', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Pago', key: 'metodoPago', width: 20 },
      { header: 'Estado', key: 'estado', width: 20 }
    ];

    results.forEach((row, i) => {
      worksheet.addRow({
        n: i + 1,
        ...row,
        fecha: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : ''
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=historial_ventas.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('❌ Error al generar Excel de ventas:', err);
    res.status(500).send('Error al generar Excel de ventas');
  }
});




// ----------------------
// RUTA PARA OBTENER LOS TALLERES 
// ----------------------
app.get('/api/talleres', async (req, res) => {
  const sql = `
    SELECT
      P.Nombre AS NombreVendedor,
      I.NombreComercio,
      I.Latitud,
      I.Longitud,
      I.HoraInicio,
      I.HoraFin,
      I.DiasAtencion,
      P.Barrio
    FROM informacionVendedor I
    INNER JOIN Perfil P ON I.InfoVendedor = P.Usuario;
  `;

  try {
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('❌ Error al obtener ubicaciones:', err);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
});


// ===============================
//  REGISTRO DE USUARIO-FORMULARIO
// ===============================
import fetch from 'node-fetch'; // si no lo tienes instalado: npm install node-fetch

const tempDir = path.join(process.cwd(), 'public', 'imagen', 'temp');
fs.mkdirSync(tempDir, { recursive: true });

// Guardamos primero en temp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Función auxiliar para consultas
const queryPromise = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Ruta unificada de registro
app.post(
  '/api/registro',
  upload.fields([
    { name: 'FotoPerfil', maxCount: 1 },
    { name: 'Certificado', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const data = req.body || {};
      const files = req.files || {};

      console.log('📦 Datos recibidos:', data);
      console.log('📸 Archivos recibidos:', files);

      // Normalizar tipo de usuario
      const tipoKey = (data.TipoUsuario || '').toLowerCase();
      const tipoMap = {
        natural: 'Natural',
        comerciante: 'Comerciante',
        servicio: 'PrestadorServicios',
        prestadorservicio: 'PrestadorServicios',
      };
      const tipoFolder = tipoMap[tipoKey] || 'Otros';
      let tipoUsuarioSQL =
        tipoKey === 'natural'
          ? 'Natural'
          : tipoKey === 'comerciante'
          ? 'Comerciante'
          : 'PrestadorServicio';

      const idUsuarioValue = data.Usuario;
      const partes = (data.Nombre || '').trim().split(' ');
      const nombre = partes.slice(0, -1).join(' ') || data.Nombre;
      const apellido = partes.slice(-1).join(' ') || '';

      const fotoPerfilFile = files.FotoPerfil ? files.FotoPerfil[0] : null;
      if (!fotoPerfilFile)
        return res.status(400).json({ error: 'Debe subir una foto de perfil' });

      // Verificar si ya existe
      const usuarioExistente = await queryPromise(
        'SELECT IdUsuario FROM Usuario WHERE IdUsuario = ?',
        [idUsuarioValue]
      );
      if (usuarioExistente.length > 0)
        return res.status(400).json({ mensaje: 'El usuario ya está registrado.' });

      // Insertar en Usuario
      const insertUsuarioSQL = `
        INSERT INTO Usuario
          (IdUsuario, TipoUsuario, Nombre, Apellido, Documento, Telefono, Correo, FotoPerfil)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const usuarioValues = [
        idUsuarioValue,
        tipoUsuarioSQL,
        nombre,
        apellido,
        idUsuarioValue,
        data.Telefono || null,
        data.Correo || null,
        fotoPerfilFile.filename,
      ];

      await queryPromise(insertUsuarioSQL, usuarioValues);

      // Mover la foto a su carpeta final
      const finalUserDir = path.join(
        process.cwd(),
        'public',
        'imagen',
        tipoFolder,
        idUsuarioValue
      );
      fs.mkdirSync(finalUserDir, { recursive: true });

      const finalFotoName = `${Date.now()}_${Math.round(
        Math.random() * 1e6
      )}${path.extname(fotoPerfilFile.originalname)}`;
      const finalFotoPath = path.join(finalUserDir, finalFotoName);
      fs.renameSync(fotoPerfilFile.path, finalFotoPath);
      const fotoRuta = path
        .join('imagen', tipoFolder, idUsuarioValue, finalFotoName)
        .replace(/\\/g, '/');

      await queryPromise(
        'UPDATE Usuario SET FotoPerfil = ? WHERE IdUsuario = ?',
        [fotoRuta, idUsuarioValue]
      );

      // Crear credenciales
      await crearCredenciales(idUsuarioValue, idUsuarioValue, data.Correo, fotoRuta);

      // Insertar perfil correspondiente
      if (tipoKey === 'natural') {
        await queryPromise(
          `INSERT INTO \`PerfilNatural\` (UsuarioNatural, Direccion, Barrio)
           VALUES (?, ?, ?)`,
          [idUsuarioValue, data.Direccion || null, data.Barrio || null]
        );

      } else if (tipoKey === 'comerciante') {
        // 🗺️ 1. Armar dirección completa para geocodificar
        const direccionCompleta = `${data.Direccion || ''}, ${data.Barrio || ''}, Bogotá, Colombia`;

        let latitud = 4.710989;
        let longitud = -74.072092;

        try {
          console.log(`📍 Buscando coordenadas para: ${direccionCompleta}`);
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionCompleta)}`,
            {
              headers: {
                'User-Agent': 'RPM-Market/1.0 (contacto@rpm-market.com)',
              },
            }
          );
          const geoData = await geoResponse.json();

          if (geoData && geoData.length > 0) {
            latitud = parseFloat(geoData[0].lat);
            longitud = parseFloat(geoData[0].lon);
            console.log(`✅ Coordenadas obtenidas: ${latitud}, ${longitud}`);
          } else {
            console.warn('⚠️ No se encontraron coordenadas exactas, se usarán valores por defecto.');
          }
        } catch (geoError) {
          console.error('❌ Error obteniendo coordenadas:', geoError);
        }

        // 🏪 2. Insertar registro del comerciante
        await queryPromise(
          `INSERT INTO Comerciante
            (NitComercio, Comercio, NombreComercio, Direccion, Barrio, RedesSociales, DiasAtencion, HoraInicio, HoraFin, Latitud, Longitud)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            data.NitComercio || null,
            idUsuarioValue,
            data.NombreComercio || null,
            data.Direccion || null,
            data.Barrio || null,
            data.RedesSociales || null,
            data.DiasAtencion || null,
            data.HoraInicio || null,
            data.HoraFin || null,
            latitud,
            longitud,
          ]
        );

        console.log(`✅ Comerciante registrado con coordenadas: ${latitud}, ${longitud}`);

      } else if (
        tipoKey === 'servicio' ||
        tipoKey === 'prestadorservicio' ||
        tipoKey === 'prestadorservicios'
      ) {
        const certificadoFile = files.Certificado ? files.Certificado[0] : null;
        if (!certificadoFile)
          return res.status(400).json({ error: 'Debe subir un certificado válido' });

        const finalCertName = `${Date.now()}_${Math.round(
          Math.random() * 1e6
        )}${path.extname(certificadoFile.originalname)}`;
        const finalCertPath = path.join(finalUserDir, finalCertName);
        fs.renameSync(certificadoFile.path, finalCertPath);
        const certRuta = path
          .join('imagen', tipoFolder, idUsuarioValue, finalCertName)
          .replace(/\\/g, '/');

        await queryPromise(
          `INSERT INTO PrestadorServicio
            (Usuario, Direccion, Barrio, RedesSociales, Certificado, DiasAtencion, HoraInicio, HoraFin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idUsuarioValue,
            data.Direccion || null,
            data.Barrio || null,
            data.RedesSociales || null,
            certRuta,
            data.DiasAtencion || null,
            data.HoraInicio || null,
            data.HoraFin || null,
          ]
        );
      }

      console.log(`✅ Registro completo: ${idUsuarioValue}`);
      res.status(200).json({
        mensaje: 'Registro exitoso',
        usuario: idUsuarioValue,
      });

    } catch (error) {
      console.error('❌ Error en /api/registro:', error);
      return res.status(500).json({ error: 'Error al procesar registro' });
    }
  }
);


// ----------------------
// Helpers
// ----------------------
// 🧹 Elimina archivos temporales creados por Multer
function cleanupTempFiles(files, tempDir) {
  try {
    if (!files) return;
    Object.values(files).forEach(fileArr => {
      fileArr.forEach(f => {
        const filePath = path.join(tempDir, f.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });
  } catch (e) {
    console.warn('⚠️ cleanupTempFiles error:', e.message);
  }
}

// 📍 Normaliza direcciones (por ejemplo: "Cra" → "Carrera", "Cl" → "Calle")
function normalizarDireccion(dir) {
  return (dir || '')
    .replace(/\bCra\b/gi, 'Carrera')
    .replace(/\bCl\b/gi, 'Calle')
    .replace(/\bAv\b/gi, 'Avenida');
}

// ---------------------- 
// SECCION PUBLICACIONES COMERCIANTE - VISUALIZACION PUBLICACION NATURAL- PUBLICACION PRESTADOR SERVICIO
// ----------------------
// ----------------------
// 📦 CREAR NUEVA PUBLICACIÓN - USUARIO COMERCIANTE
// ----------------------
// --- CONFIGURACIÓN MULTER PARA PUBLICACIONES ---
const storagePublicacion = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const nombreUnico =
      Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, nombreUnico);
  }
});

const uploadPublicacion = multer({
  storage: storagePublicacion,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ----------------------
// 🧾 API PARA PUBLICAR
// ----------------------
// ===========================
// 📦 PUBLICAR PRODUCTO
// ===========================
// ===========================
// 📦 PUBLICAR PRODUCTO (con carpeta individual por ID)
// ===========================
app.post('/api/publicar', uploadPublicacion.array('imagenesProducto', 5), async (req, res) => {
  const usuario = req.session.usuario;

  // 🔒 Validación de acceso
  if (!usuario || usuario.tipo !== 'Comerciante') {
    cleanupTempFiles(req.files, tempDir);
    return res.status(403).json({ error: 'Acceso no autorizado. Solo comerciantes pueden publicar.' });
  }

  const { nombreProducto, categoriaProducto, precioProducto, cantidadProducto, descripcionProducto } = req.body;

  // 🧩 Validar campos
  if (!nombreProducto || !categoriaProducto || !precioProducto || !cantidadProducto || !descripcionProducto) {
    cleanupTempFiles(req.files, tempDir);
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  }

  const connection = await pool.getConnection();

  try {
    // 🔹 Obtener NIT del comerciante asociado
    const [rowsComercio] = await connection.query(
      'SELECT NitComercio FROM Comerciante WHERE Comercio = ? LIMIT 1',
      [usuario.id]
    );

    if (rowsComercio.length === 0) {
      cleanupTempFiles(req.files, tempDir);
      return res.status(404).json({ error: 'No se encontró el comercio asociado al usuario.' });
    }

    const nitComercio = rowsComercio[0].NitComercio;

    // 🔹 Buscar categoría
    const [rowsCategoria] = await connection.query(
      'SELECT IdCategoria FROM Categoria WHERE LOWER(NombreCategoria) = LOWER(?) LIMIT 1',
      [categoriaProducto]
    );

    if (rowsCategoria.length === 0) {
      cleanupTempFiles(req.files, tempDir);
      return res.status(400).json({ error: `La categoría '${categoriaProducto}' no existe.` });
    }

    const idCategoria = rowsCategoria[0].IdCategoria;

    // 🔹 Primero insertamos una publicación "temporal" sin imágenes
    const [resultPub] = await connection.query(
      `
      INSERT INTO Publicacion (Comerciante, NombreProducto, Descripcion, Categoria, Precio, Stock, ImagenProducto)
      VALUES (?, ?, ?, ?, ?, ?, '[]')
      `,
      [nitComercio, nombreProducto, descripcionProducto, idCategoria, precioProducto, cantidadProducto]
    );

    const idPublicacion = resultPub.insertId;
    console.log('✅ Publicación creada con ID:', idPublicacion);

    // 🔹 Crear carpeta de la publicación usando su ID
    const carpetaPublicacion = path.join(
      process.cwd(),
      'public', 'imagen', 'Comerciante', usuario.id.toString(), 'publicaciones', idPublicacion.toString()
    );
    fs.mkdirSync(carpetaPublicacion, { recursive: true });

    // 🔹 Mover imágenes desde temp a carpeta específica
    const imagenes = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach(file => {
        const destino = path.join(carpetaPublicacion, file.filename);
        fs.renameSync(file.path, destino);
        imagenes.push(
          path.join('imagen', 'Comerciante', usuario.id.toString(), 'publicaciones', idPublicacion.toString(), file.filename)
        );
      });
    }

    // 🔹 Si no hay imágenes, usar una por defecto
    const imagenFinal = imagenes.length > 0
      ? JSON.stringify(imagenes)
      : JSON.stringify(['/imagen/default_producto.jpg']);

    // 🔹 Actualizar publicación con rutas finales
    await connection.query(
      'UPDATE Publicacion SET ImagenProducto = ? WHERE IdPublicacion = ?',
      [imagenFinal, idPublicacion]
    );

    // 🔹 Insertar producto vinculado
    await connection.query(
      `
      INSERT INTO Producto (PublicacionComercio, NombreProducto, Descripcion, IdCategoria, Precio, Stock)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [idPublicacion, nombreProducto, descripcionProducto, idCategoria, precioProducto, cantidadProducto]
    );

    res.json({ mensaje: '✅ Publicación creada exitosamente', idPublicacion });

  } catch (err) {
    console.error('❌ Error en /api/publicar:', err);
    cleanupTempFiles(req.files, tempDir);
    res.status(500).json({ error: 'Error al registrar la publicación.' });
  } finally {
    connection.release();
  }
});



// REGISTRO / HISTORIAL DE PUBLICACIONES
// ----------------------
app.get('/api/publicaciones', async (req, res) => {
  try {
    const usuario = req.session.usuario;

    if (!usuario || usuario.tipo !== 'Comerciante') {
      return res.status(403).json({ error: 'Acceso no autorizado. Solo comerciantes pueden ver sus publicaciones.' });
    }

    // 🔹 1. Buscar el NIT del comercio asociado al usuario
    const [comercio] = await pool.query(
      'SELECT NitComercio FROM Comerciante WHERE Comercio = ? LIMIT 1',
      [usuario.id]
    );

    if (!comercio || comercio.length === 0) {
      return res.status(404).json({ error: 'No se encontró el comercio asociado a este usuario.' });
    }

    const nitComercio = comercio[0].NitComercio;

    // 🔹 2. Obtener publicaciones del comerciante
    const [publicaciones] = await pool.query(
      `
        SELECT IdPublicacion, NombreProducto, Precio, ImagenProducto
        FROM Publicacion
        WHERE Comerciante = ?
        ORDER BY IdPublicacion DESC
      `,
      [nitComercio]
    );

    res.json(publicaciones);
  } catch (err) {
    console.error('❌ Error al obtener las publicaciones:', err);
    res.status(500).json({ error: 'Error interno al obtener las publicaciones.' });
  }
});



// ELIMINAR PUBLICACIÓN Y SU CARPETA
// ----------------------
app.delete('/api/publicaciones/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const idPublicacion = req.params.id;

    if (!usuario || usuario.tipo !== 'Comerciante') {
      return res.status(403).json({ error: 'Acceso no autorizado. Solo comerciantes pueden eliminar publicaciones.' });
    }

    // 🔹 1️⃣ Obtener el NIT del comercio asociado al usuario
    const [comercio] = await pool.query(
      'SELECT NitComercio FROM Comerciante WHERE Comercio = ? LIMIT 1',
      [usuario.id]
    );

    if (!comercio || comercio.length === 0) {
      return res.status(404).json({ error: 'No se encontró el comercio asociado.' });
    }

    const nitComercio = comercio[0].NitComercio;

    // 🔹 2️⃣ Verificar que la publicación exista y obtener las imágenes
    const [publicacion] = await pool.query(
      'SELECT ImagenProducto FROM Publicacion WHERE IdPublicacion = ? AND Comerciante = ?',
      [idPublicacion, nitComercio]
    );

    if (!publicacion || publicacion.length === 0) {
      return res.status(404).json({ error: 'No se encontró la publicación o no pertenece a tu comercio.' });
    }

    let imagenes = [];
    try {
      imagenes = JSON.parse(publicacion[0].ImagenProducto || '[]');
    } catch (parseErr) {
      console.warn('⚠️ No se pudieron parsear las imágenes:', parseErr);
    }

    // 🔹 3️⃣ Eliminar productos asociados
    await pool.query('DELETE FROM Producto WHERE PublicacionComercio = ?', [idPublicacion]);

    // 🔹 4️⃣ Eliminar la publicación
    await pool.query('DELETE FROM Publicacion WHERE IdPublicacion = ? AND Comerciante = ?', [
      idPublicacion,
      nitComercio
    ]);

    // 🔹 5️⃣ Eliminar carpeta completa de la publicación
    const carpetaPublicacion = path.join(
      __dirname,
      'public',
      'imagen',
      'Comerciante',
      usuario.id.toString(),
      'publicaciones',
      idPublicacion.toString()
    );

    try {
      if (fs.existsSync(carpetaPublicacion)) {
        fs.rmSync(carpetaPublicacion, { recursive: true, force: true });
        console.log(`🗑️ Carpeta eliminada correctamente: ${carpetaPublicacion}`);
      } else {
        console.warn('⚠️ Carpeta no encontrada (posiblemente ya eliminada):', carpetaPublicacion);
      }
    } catch (fsErr) {
      console.error('❌ Error al eliminar carpeta:', fsErr);
    }

    // 🔹 6️⃣ Confirmar eliminación
    res.json({
      mensaje: '✅ Publicación, productos asociados y carpeta eliminados exitosamente.'
    });
  } catch (err) {
    console.error('❌ Error al eliminar publicación:', err);
    res.status(500).json({ error: 'Error interno al eliminar la publicación.' });
  }
});


// 🟢 OBTENER UNA PUBLICACIÓN EN ESPECÍFICO POR ID
app.get('/api/publicaciones/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const idPublicacion = req.params.id;

    if (!usuario || usuario.tipo !== 'Comerciante') {
      return res.status(403).json({ error: 'Acceso no autorizado. Solo comerciantes pueden ver publicaciones.' });
    }

    // 🔹 1️⃣ Obtener el NIT del comercio asociado al usuario
    const [comercio] = await pool.query(
      'SELECT NitComercio FROM Comerciante WHERE Comercio = ? LIMIT 1',
      [usuario.id]
    );

    if (!comercio || comercio.length === 0) {
      return res.status(404).json({ error: 'No se encontró el comercio asociado.' });
    }

    const nitComercio = comercio[0].NitComercio;

    // 🔹 2️⃣ Traer los datos completos de la publicación
    const queryPublicacion = `
      SELECT 
        IdPublicacion,
        NombreProducto,
        Descripcion,
        Categoria AS IdCategoria,
        (SELECT NombreCategoria FROM Categoria WHERE IdCategoria = Publicacion.Categoria) AS NombreCategoria,
        Precio,
        ImagenProducto
      FROM Publicacion
      WHERE IdPublicacion = ? AND Comerciante = ?
      LIMIT 1
    `;

    const [publicacion] = await pool.query(queryPublicacion, [idPublicacion, nitComercio]);

    if (!publicacion || publicacion.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada o no pertenece al comerciante.' });
    }

    // 🔹 3️⃣ Parsear imágenes si existen
    const pub = publicacion[0];
    try {
      pub.ImagenProducto = JSON.parse(pub.ImagenProducto || '[]');
    } catch {
      pub.ImagenProducto = [];
    }

    // 🔹 4️⃣ Respuesta final
    res.json(pub);

  } catch (err) {
    console.error('❌ Error al obtener la publicación:', err);
    res.status(500).json({ error: 'Error interno al obtener la publicación.' });
  }
});

// ----------------------
// OBTENER TODAS LAS CATEGORÍAS
// ----------------------
app.get('/api/categorias', async (req, res) => {
  try {
    const [categorias] = await pool.query(
      'SELECT IdCategoria, NombreCategoria FROM Categoria ORDER BY NombreCategoria ASC'
    );

    // 🔹 Filtramos categorías que contengan "grua"
    const categoriasFiltradas = categorias.filter(c =>
      !c.NombreCategoria.toLowerCase().includes('grua')
    );

    res.json(categoriasFiltradas);
  } catch (err) {
    console.error('❌ Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener las categorías.' });
  }
});

// ----------------------
// EDITAR Y ACTUALIZAR UNA PUBLICACIÓN
// ----------------------

// 📂 MULTER PARA EDITAR PUBLICACIONES
const storageEditar = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'imagen', 'temp_editar');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadEditar = multer({ storage: storageEditar });

// 🟢 ACTUALIZAR PUBLICACIÓN
app.put('/api/publicaciones/:id', uploadEditar.array('imagenesNuevas', 10), async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const idPublicacion = req.params.id;

    if (!usuario || usuario.tipo !== 'Comerciante') {
      return res.status(403).json({ error: 'Acceso no autorizado.' });
    }

    const { titulo, precio, categoria, descripcion } = req.body;

    let imagenesActuales = [];
    try {
      imagenesActuales = JSON.parse(req.body.imagenesActuales || '[]');
    } catch {
      imagenesActuales = [];
    }

    // 🔹 1️⃣ Obtener NIT del comerciante
    const [comercio] = await pool.query(
      'SELECT NitComercio FROM Comerciante WHERE Comercio = ? LIMIT 1',
      [usuario.id]
    );

    if (!comercio || comercio.length === 0) {
      return res.status(404).json({ error: 'No se encontró el comercio asociado.' });
    }

    const nitComercio = comercio[0].NitComercio;

    // 🔹 2️⃣ Rutas de nuevas imágenes
    const nuevasImagenes = (req.files || []).map(f => f.path.replace(/\\/g, '/'));
    const todasLasImagenes = [...imagenesActuales, ...nuevasImagenes];
    const rutaBase = path.join(__dirname, 'public');

    // 🔹 3️⃣ Obtener imágenes anteriores para eliminar las que ya no están
    const [resultPub] = await pool.query(
      'SELECT ImagenProducto FROM Publicacion WHERE IdPublicacion = ? AND Comerciante = ?',
      [idPublicacion, nitComercio]
    );

    if (!resultPub || resultPub.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada o no pertenece al comerciante.' });
    }

    let anteriores = [];
    try {
      anteriores = JSON.parse(resultPub[0].ImagenProducto || '[]');
    } catch {
      anteriores = [];
    }

    // 🔹 4️⃣ Eliminar del disco las imágenes quitadas por el usuario
    const eliminadas = anteriores.filter(img => !imagenesActuales.includes(img));
    eliminadas.forEach(imgPath => {
      const fullPath = path.join(rutaBase, imgPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    // 🔹 5️⃣ Actualizar la publicación en la base de datos
    const queryUpdate = `
      UPDATE Publicacion
      SET NombreProducto = ?, Precio = ?, Categoria = ?, Descripcion = ?, ImagenProducto = ?
      WHERE IdPublicacion = ? AND Comerciante = ?
    `;

    await pool.query(queryUpdate, [
      titulo,
      precio,
      categoria,
      descripcion,
      JSON.stringify(todasLasImagenes),
      idPublicacion,
      nitComercio,
    ]);

    console.log('✅ Publicación actualizada correctamente');
    res.json({ mensaje: 'Publicación actualizada correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar publicación:', err);
    res.status(500).json({ error: 'Error interno al actualizar la publicación.' });
  }
});

// ----------------------
// PUBLICACIONES PÚBLICAS (visibles para todos)
app.get('/api/publicaciones_publicas', async (req, res) => {
  try {
    const { categoria, limite } = req.query;

    let query = `
      SELECT 
        p.IdPublicacion,
        p.NombreProducto AS nombreProducto,
        p.Precio,
        (SELECT NombreCategoria FROM Categoria WHERE IdCategoria = p.Categoria) AS categoria,
        p.ImagenProducto
      FROM Publicacion p
      WHERE 1
    `;

    const params = [];

    // 🔹 Filtro opcional por categoría
    if (categoria && categoria.toLowerCase() !== 'todos') {
      query += ` AND p.Categoria = (SELECT IdCategoria FROM Categoria WHERE LOWER(NombreCategoria) = LOWER(?))`;
      params.push(categoria);
    }

    // 🔹 Ordenar por las más recientes
    query += ` ORDER BY p.IdPublicacion DESC`;

    // 🔹 Límite opcional
    if (limite) {
      query += ` LIMIT ?`;
      params.push(parseInt(limite));
    }

    const [rows] = await pool.query(query, params);

    // 🔹 Parsear imágenes y normalizar rutas
    const publicaciones = rows.map(pub => {
      let imagenes = [];
      try {
        imagenes = JSON.parse(pub.ImagenProducto || '[]');

        // Normalizar rutas: reemplazar backslashes y agregar /image/ si no existe
        imagenes = imagenes.map(img => {
          let ruta = img.replace(/\\/g, '/'); // reemplaza "\" por "/"
          // Quitar prefijo "image/" si ya existe
          ruta = ruta.replace(/^\/?image\//i, '');
          // Agregar /image/ al inicio
          return '/image/' + ruta;
        });

      } catch {
        imagenes = [];
      }

      return {
        idPublicacion: pub.IdPublicacion,
        nombreProducto: pub.nombreProducto,
        precio: pub.Precio,
        categoria: pub.categoria,
        imagenes
      };
    });

    res.json(publicaciones);

  } catch (error) {
    console.error('❌ Error al obtener publicaciones públicas:', error);
    res.status(500).json({ error: 'Error al obtener publicaciones públicas.' });
  }
});


// ---------------------- 
// SECCION USUARIO COMERCIANTE 
// ----------------------

// DASHBOARD USUARIO COMERCIANTE
// ----------------------

app.get('/api/dashboard/comerciante', async (req, res) => {
  try {
    // 🧩 Validar sesión activa
    if (!req.session || !req.session.usuarioId) {
      return res.status(401).json({ error: 'No has iniciado sesión.' });
    }

    const idUsuario = req.session.usuarioId;

    // 🔍 Obtener el NIT del comerciante logueado
    const [comercianteRows] = await pool.query(
      'SELECT NitComercio FROM Comerciante WHERE Comercio = ?',
      [idUsuario]
    );

    if (comercianteRows.length === 0) {
      return res.status(403).json({ error: 'No se encontró información del comerciante.' });
    }

    const nitComercio = comercianteRows[0].NitComercio;

    // 🧾 Consultar las ventas del comerciante
    const [result] = await pool.query(`
      SELECT 
        c.NombreComercio,
        cat.NombreCategoria,
        p.NombreProducto,
        COUNT(f.IdFactura) AS totalVentas,
        SUM(f.TotalPago) AS totalRecaudado,
        DATE(f.FechaCompra) AS fechaCompra
      FROM Factura f
      INNER JOIN Carrito ca ON f.Carrito = ca.IdCarrito
      INNER JOIN Publicacion p ON ca.Publicacion = p.IdPublicacion
      INNER JOIN Categoria cat ON p.Categoria = cat.IdCategoria
      INNER JOIN Comerciante c ON p.Comerciante = c.NitComercio
      WHERE c.NitComercio = ?
      GROUP BY cat.NombreCategoria, p.NombreProducto, fechaCompra
      ORDER BY fechaCompra DESC
    `, [nitComercio]);

    // 💰 Calcular totales
    let totalVentas = 0;
    let totalRecaudado = 0;
    let ventasPorCategoria = {};
    let categorias = new Set();

    result.forEach(row => {
      totalVentas += row.totalVentas;
      totalRecaudado += row.totalRecaudado;
      categorias.add(row.NombreCategoria);
      ventasPorCategoria[row.NombreCategoria] = (ventasPorCategoria[row.NombreCategoria] || 0) + row.totalRecaudado;
    });

    // 📅 Ventas del día y de la semana
    const hoy = new Date().toISOString().split('T')[0];
    const semanaPasada = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const ventasHoy = result
      .filter(r => r.fechaCompra === hoy)
      .reduce((acc, r) => acc + r.totalRecaudado, 0);

    const ventasSemana = result
      .filter(r => new Date(r.fechaCompra) >= semanaPasada)
      .reduce((acc, r) => acc + r.totalRecaudado, 0);

    // 📤 Respuesta final
    res.json({
      totalVentas,
      totalRecaudado,
      ventasHoy,
      ventasSemana,
      categorias: Array.from(categorias),
      ventasPorCategoria: Array.from(categorias).map(cat => ventasPorCategoria[cat] || 0)
    });

  } catch (error) {
    console.error('❌ Error en dashboard comerciante:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener el dashboard del comerciante.' });
  }
});


// ---------------------- 
// EDITAR PERFIL COMERCIANTE
// ----------------------
//  ACTUALIZAR PERFIL COMERCIANTE
// ===============================
app.put(
  "/api/actualizarPerfilComerciante/:idUsuario",
  upload.single("FotoPerfil"),
  async (req, res) => {
    const { idUsuario } = req.params;
    const data = req.body || {};
    const nuevaFoto = req.file || null;

    try {
      // 1️⃣ Verificar si el usuario existe
      const [usuarioRows] = await pool.query(
        "SELECT FotoPerfil FROM Usuario WHERE IdUsuario = ?",
        [idUsuario]
      );

      if (usuarioRows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      let rutaFotoFinal = usuarioRows[0].FotoPerfil;

      // 2️⃣ Si se sube una nueva foto de perfil
      if (nuevaFoto) {
        const tipoFolder = "Comerciante";
        const userFolder = path.join(
          __dirname,
          "public",
          "imagen",
          tipoFolder,
          idUsuario
        );

        // Crear carpeta si no existe
        fs.mkdirSync(userFolder, { recursive: true });

        // Eliminar foto anterior (si existe)
        if (rutaFotoFinal) {
          const rutaFotoAnterior = path.join(__dirname, "public", rutaFotoFinal);
          if (fs.existsSync(rutaFotoAnterior)) {
            fs.unlinkSync(rutaFotoAnterior);
          }
        }

        // Generar nuevo nombre único
        const nuevoNombreFoto = `${Date.now()}_${Math.round(
          Math.random() * 1e6
        )}${path.extname(nuevaFoto.originalname)}`;

        const rutaDestino = path.join(userFolder, nuevoNombreFoto);

        // Mover archivo desde la carpeta temporal
        fs.renameSync(nuevaFoto.path, rutaDestino);

        // Guardar ruta relativa (para mostrar en frontend)
        rutaFotoFinal = path
          .join("imagen", tipoFolder, idUsuario, nuevoNombreFoto)
          .replace(/\\/g, "/");

        // Actualizar campo de la foto en la base de datos
        await pool.query(
          "UPDATE Usuario SET FotoPerfil = ? WHERE IdUsuario = ?",
          [rutaFotoFinal, idUsuario]
        );
      }

      // 3️⃣ Actualizar información básica del usuario
      await pool.query(
        `UPDATE Usuario 
         SET Nombre = ?, Apellido = ?, Telefono = ?, Correo = ?
         WHERE IdUsuario = ?`,
        [
          data.Nombre || null,
          data.Apellido || null,
          data.Telefono || null,
          data.Correo || null,
          idUsuario,
        ]
      );

      // 4️⃣ Actualizar información del comercio asociado
      await pool.query(
        `UPDATE Comerciante
         SET NombreComercio = ?, NitComercio = ?, Direccion = ?, Barrio = ?, RedesSociales = ?,
             DiasAtencion = ?, HoraInicio = ?, HoraFin = ?
         WHERE Comercio = ?`,
        [
          data.NombreComercio || null,
          data.NitComercio || null,
          data.Direccion || null,
          data.Barrio || null,
          data.RedesSociales || null,
          data.DiasAtencion || null,
          data.HoraInicio || null,
          data.HoraFin || null,
          idUsuario,
        ]
      );

      // ✅ Respuesta final
      res.json({
        mensaje: "✅ Perfil actualizado correctamente",
        fotoPerfil: rutaFotoFinal,
      });
    } catch (error) {
      console.error("❌ Error al actualizar perfil comerciante:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// 📋 OBTENER PERFIL DEL COMERCIANTE
// ===============================
app.get("/api/perfilComerciante/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        u.IdUsuario,
        u.Nombre,
        u.Apellido,
        u.Telefono,
        u.Correo,
        u.FotoPerfil,
        c.NombreComercio,
        c.NitComercio,
        c.Direccion,
        c.Barrio,
        c.RedesSociales,
        c.DiasAtencion,
        c.HoraInicio,
        c.HoraFin
      FROM Usuario u
      LEFT JOIN Comerciante c ON u.IdUsuario = c.Comercio
      WHERE u.IdUsuario = ?
      `,
      [idUsuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Comerciante no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener perfil del comerciante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// ---------------------- 
// SECCION USUARIO NATURAL 
// ----------------------

// Ruta API para detalle de publicación
// ============================
// Ruta API para detalle de publicación
// ============================
app.get('/api/detallePublicacion/:id', async (req, res) => {
    const idPublicacion = req.params.id;

    try {
        // Consulta principal de la publicación
        const [resultado] = await pool.query(
            `SELECT 
                p.IdPublicacion,
                p.NombreProducto,
                p.Descripcion,
                p.Precio,
                p.Stock,
                p.ImagenProducto,
                p.FechaPublicacion,
                c.NombreComercio,
                u.Nombre AS NombreUsuario,
                u.Apellido AS ApellidoUsuario,
                IFNULL(AVG(o.Calificacion), 0) AS CalificacionPromedio
            FROM Publicacion p
            JOIN Comerciante c ON p.Comerciante = c.NitComercio
            JOIN Usuario u ON c.Comercio = u.IdUsuario
            LEFT JOIN Opiniones o ON o.Publicacion = p.IdPublicacion
            WHERE p.IdPublicacion = ?
            GROUP BY p.IdPublicacion, c.NombreComercio, u.Nombre, u.Apellido`,
            [idPublicacion]
        );

        if (resultado.length === 0) {
            return res.status(404).json({ msg: 'Publicación no encontrada' });
        }

        // Consulta de opiniones
        const [opiniones] = await pool.query(
            `SELECT 
                o.IdOpinion, 
                o.Comentario, 
                o.Calificacion, 
                o.FechaOpinion, 
                u.Nombre, 
                u.Apellido
            FROM Opiniones o
            JOIN Usuario u ON o.UsuarioNatural = u.IdUsuario
            WHERE o.Publicacion = ?
            ORDER BY o.FechaOpinion DESC`,
            [idPublicacion]
        );

        // Guardar la imagen como string directamente (sin parse)
        const imagenes = [resultado[0].ImagenProducto.replace(/\\/g, '/')];

        // Enviar datos completos
        res.json({
            publicacion: {
                ...resultado[0],
                ImagenProducto: imagenes
            },
            opiniones
        });

    } catch (err) {
        console.error('Error en /api/detallePublicacion/:id', err);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
});

// Ruta del HTML detalle_producto
app.get('/detalle_producto.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'detalle_producto.html'));
});


//AGREGAR AL CARRITO//

// Middleware

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ✅ Ruta para agregar producto al carrito
app.post('/api/carrito', async (req, res) => {
    try {
        const { idUsuario, idPublicacion } = req.body;

        if (!idUsuario || !idPublicacion) {
            return res.status(400).json({ msg: 'Faltan datos necesarios' });
        }

        // 🔹 Consultar el precio del producto desde la publicación
        const [producto] = await pool.query(
            `SELECT Precio FROM Publicacion WHERE IdPublicacion = ?`,
            [idPublicacion]
        );

        if (producto.length === 0) {
            return res.status(404).json({ msg: 'Publicación no encontrada' });
        }

        const precio = producto[0].Precio;

        // 🔹 Insertar en la tabla Carrito
        await pool.query(
            `INSERT INTO Carrito (UsuarioNat, Publicacion, Cantidad, SubTotal, Estado)
             VALUES (?, ?, 1, ?, 'Pendiente')`,
            [idUsuario, idPublicacion, precio]
        );

        res.json({ msg: 'Producto añadido al carrito correctamente' });
    } catch (err) {
        console.error('❌ Error al agregar al carrito:', err);
        res.status(500).json({ msg: 'Error al agregar el producto al carrito' });
    }
});

//AGREGAR OPINIONES//

app.post('/api/opiniones', async (req, res) => {
  try {
    const { usuarioId, idPublicacion, nombreUsuario, comentario, calificacion } = req.body;

    if (!usuarioId || !idPublicacion || !comentario || !calificacion) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Insertar en la tabla Opiniones
    const [resultado] = await pool.query(
      `INSERT INTO Opiniones (UsuarioNatural, Publicacion, NombreUsuario, Comentario, Calificacion)
       VALUES (?, ?, ?, ?, ?)`,
      [usuarioId, idPublicacion, nombreUsuario, comentario, calificacion]
    );

    res.json({
      mensaje: '✅ Opinión guardada correctamente',
      idOpinion: resultado.insertId
    });

  } catch (error) {
    console.error('❌ Error al insertar opinión:', error);
    res.status(500).json({ error: 'Error en el servidor al guardar la opinión.' });
  }
});

// VER CARRITO DE COMPRAS DEL USUARIO LOGUEADO - NATURAL
app.get('/api/carrito', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.status(401).json({ msg: 'No hay usuario en sesión' });

    const [carrito] = await pool.query(`
      SELECT 
        c.IdCarrito,
        p.NombreProducto,
        p.Precio,
        c.Cantidad,
        (p.Precio * c.Cantidad) AS Total
      FROM Carrito c
      JOIN Publicacion p ON c.Publicacion = p.IdPublicacion
      WHERE c.UsuarioNat = ? AND c.Estado = 'Pendiente'
    `, [usuario.id]);

    res.json(carrito);
  } catch (err) {
    console.error('❌ Error al obtener el carrito:', err);
    res.status(500).json({ msg: 'Error al obtener el carrito' });
  }
});


// 🔄 Actualizar cantidad de un producto en el carrito
app.put('/api/carrito/:id', async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  try {
    await pool.query(
      `UPDATE Carrito SET Cantidad = ?, SubTotal = (Cantidad * SubTotal / Cantidad) WHERE IdCarrito = ?`,
      [cantidad, id]
    );
    res.json({ msg: 'Cantidad actualizada' });
  } catch (err) {
    console.error('❌ Error al actualizar cantidad:', err);
    res.status(500).json({ msg: 'Error al actualizar cantidad' });
  }
});


// ❌ Eliminar producto del carrito
app.delete('/api/carrito/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Carrito WHERE IdCarrito = ?', [id]);
    res.json({ msg: 'Producto eliminado' });
  } catch (err) {
    console.error('❌ Error al eliminar producto:', err);
    res.status(500).json({ msg: 'Error al eliminar producto' });
  }
});




// ✅ GET /api/proceso-compra
app.get('/api/proceso-compra', async (req, res) => {
  try {
    // Asegúrate de que el usuario venga de la sesión
    const usuarioSesion = req.session && req.session.usuario;
    if (!usuarioSesion) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }
    const idUsuarioNat = usuarioSesion.id;

    const [rows] = await pool.query(
      `SELECT
         c.IdCarrito,
         c.Cantidad,
         -- Preferimos calcular subtotal aquí para evitar inconsistencias
         (p.Precio * c.Cantidad) AS Subtotal,
         p.Precio,
         p.NombreProducto AS Producto,
         c.SubTotal AS SubTotalEnCarrito,
         cm.NombreComercio,
         cm.Direccion AS DireccionComercio,
         u.IdUsuario AS IdComercioUsuario,
         u.Nombre AS NombreUsuarioComercio,
         u.Apellido AS ApellidoUsuarioComercio
       FROM Carrito c
       JOIN Publicacion p ON c.Publicacion = p.IdPublicacion
       JOIN Comerciante cm ON p.Comerciante = cm.NitComercio
       JOIN Usuario u ON cm.Comercio = u.IdUsuario
       WHERE c.UsuarioNat = ? AND c.Estado = 'Pendiente'`,
      [idUsuarioNat]
    );

    // Normalizar estructura que espera el frontend
    const resultado = rows.map(r => ({
      IdCarrito: r.IdCarrito,
      Producto: r.Producto,
      Cantidad: Number(r.Cantidad),
      Precio: Number(r.Precio),
      Subtotal: Number(r.Subtotal),
      // info del comercio por si la necesitas
      NombreComercio: r.NombreComercio,
      DireccionComercio: r.DireccionComercio,
      IdComercioUsuario: r.IdComercioUsuario,
      NombreUsuarioComercio: r.NombreUsuarioComercio,
      ApellidoUsuarioComercio: r.ApellidoUsuarioComercio
    }));

    res.json(resultado);
  } catch (err) {
    console.error('❌ Error en /api/proceso-compra:', err);
    res.status(500).json({ msg: 'Error al obtener productos para proceso de compra' });
  }
});


//PROCESO DE COMPRA//

app.post("/api/finalizar-compra", async (req, res) => {
  try {
    console.log("📦 Recibiendo solicitud para finalizar compra...");

    const { usuarioId, metodoPago } = req.body;

    console.log("🧾 Datos recibidos:", req.body);

    if (!usuarioId || !metodoPago) {
      console.warn("⚠️ Faltan datos en la solicitud:", req.body);
      return res.status(400).json({ message: "Faltan datos de usuario o método de pago." });
    }

    // 1️⃣ Consultar los productos del carrito pendientes
    const [carrito] = await pool.query(`
      SELECT 
        c.IdCarrito, 
        pub.IdPublicacion,
        p.IdProducto,
        p.NombreProducto,
        p.Precio,
        c.Cantidad,
        (p.Precio * c.Cantidad) AS Subtotal
      FROM Carrito c
      JOIN Publicacion pub ON c.Publicacion = pub.IdPublicacion
      JOIN Producto p ON p.PublicacionComercio = pub.IdPublicacion
      WHERE c.UsuarioNat = ? AND c.Estado = 'Pendiente'
    `, [usuarioId]);

    console.log("🛒 Productos en carrito:", carrito.length);

    if (carrito.length === 0) {
      return res.status(400).json({ message: "No hay productos pendientes en el carrito." });
    }

    // 2️⃣ Crear registros en DetalleFactura
    let totalCompra = 0;
    for (const item of carrito) {
      totalCompra += item.Subtotal;
      await pool.query(
        `INSERT INTO DetalleFactura (Carrito, Producto, Cantidad, PrecioUnitario, Total, Estado)
         VALUES (?, ?, ?, ?, ?, 'Pendiente')`,
        [item.IdCarrito, item.IdProducto, item.Cantidad, item.Precio, item.Subtotal]
      );
    }

    // 3️⃣ Crear la factura principal
    const [facturaResult] = await pool.query(
      `INSERT INTO Factura (DetalleFactura, Usuario, TotalPago, MetodoPago, Estado)
       VALUES (?, ?, ?, ?, 'Pago exitoso')`,
      [carrito[0].IdCarrito, usuarioId, totalCompra, metodoPago]
    );

    // 4️⃣ Marcar carrito como procesado
    await pool.query(
      `UPDATE Carrito SET Estado = 'Procesado' WHERE UsuarioNat = ? AND Estado = 'Pendiente'`,
      [usuarioId]
    );

    console.log("✅ Compra registrada correctamente. Factura:", facturaResult.insertId);

    res.json({
      success: true,
      message: "Compra finalizada correctamente",
      facturaId: facturaResult.insertId,
    });

  } catch (error) {
    console.error("❌ Error en /api/finalizar-compra:", error);
    res.status(500).json({ message: "Error al finalizar la compra", error: error.message });
  }
});



// 🔹 API: Obtener factura por ID - APARTADO DE MOSTRAR FACTURA DESPUES DE COMPRA USUARIO NATURAL
// ===============================
app.get('/api/factura/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Obtener información general de la factura y del usuario
    const [facturaRows] = await pool.query(`
      SELECT 
        f.IdFactura,
        f.FechaCompra,
        f.TotalPago,
        f.MetodoPago,
        f.Estado,
        u.Nombre AS NombreUsuario,
        u.Apellido AS ApellidoUsuario,
        u.Correo,
        u.Telefono,
        u.FotoPerfil
      FROM Factura f
      JOIN Usuario u ON f.Usuario = u.IdUsuario
      WHERE f.IdFactura = ?
    `, [id]);

    if (facturaRows.length === 0) {
      return res.status(404).json({ msg: 'Factura no encontrada' });
    }

    const factura = facturaRows[0];

    // 2️⃣ Obtener el IdDetalleFactura vinculado
    const [detalleFactura] = await pool.query(`
      SELECT IdDetalleFactura 
      FROM DetalleFactura 
      WHERE IdDetalleFactura = (
        SELECT DetalleFactura FROM Factura WHERE IdFactura = ?
      )
    `, [id]);

    if (detalleFactura.length === 0) {
      return res.status(404).json({ msg: 'No hay detalles asociados a esta factura' });
    }

    const detalleId = detalleFactura[0].IdDetalleFactura;

    // 3️⃣ Consultar los productos del detalle
    const [detalleRows] = await pool.query(`
      SELECT 
        p.Nombre AS NombreProducto,
        p.ImagenProducto,
        df.Cantidad,
        df.PrecioUnitario,
        df.Total
      FROM DetalleFactura df
      JOIN Producto p ON df.Producto = p.IdProducto
      WHERE df.IdDetalleFactura = ?
    `, [detalleId]);

    // 4️⃣ Responder con toda la información
    res.json({
      factura,
      detalles: detalleRows
    });

  } catch (error) {
    console.error('❌ Error al obtener factura:', error);
    res.status(500).json({ msg: 'Error al obtener factura' });
  }
});

