const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); // 🔧 NUEVO

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔧 NUEVO: Configuración de express-session
app.use(session({
    secret: 'clave-secreta-rpm', // cámbiala por algo más seguro en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hora
        httpOnly: true
    }
}));

// 🔐 Middleware para verificar sesión
function verificarSesion(req, res, next) {
    if (req.session.usuario) {
        next(); // Usuario tiene sesión activa
    } else {
        res.redirect('/ingreso.html'); // Redirige al login si no está logueado
    }
}
// 🔧 Middleware para evitar caché en páginas protegidas
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'rpm'
});

connection.connect((err) => {
    if (err) {
        console.error(' Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log(' Conectado a la base de datos con ID ' + connection.threadId);
});
module.exports = connection;

// Importar rutas
const registroRoute = require('./routes/registro');
app.use("/registro", registroRoute);

// Ruta para validar el login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    console.log(' Usuario recibido:', username);
    console.log(' Contraseña recibida:', password);

    const query = 'SELECT * FROM Credenciales WHERE TRIM(NombreUsuario) = TRIM(?) AND TRIM(Contrasena) = TRIM(?)';

    connection.query(query, [username, password], (error, results) => {
        if (error) {
            console.error(' Error en la consulta:', error);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        console.log(' Resultado de la consulta:', results);

        if (results.length > 0) {
            req.session.usuario = username; // 🔧 Guardar sesión
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    });
});

// 🔒 Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/Ingreso.html');
    });
});


// 🔐 Ruta para verificar sesión desde el frontend
app.get('/api/verificar-sesion', (req, res) => {
    res.json({ activa: !!req.session.usuario });
});
app.get('/perfil_usuario.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perfil_usuario.html'));
});

app.get('/dashboard_comerciante.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard_comerciante.html'));
});

app.get('/Historial_ventas.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Historial_ventas.html'));
});

app.listen(port, () => {
    console.log(` Servidor escuchando en http://localhost:${port}/index.html`);
});


// Ruta para consultar historial de compras- filtros
app.get('/api/historial', (req, res) => {
    const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;

    let query = `
        SELECT 
            p.NombreProducto AS producto,
            c.NombreCategoria AS categoria,
            f.RegistroCompra AS fecha,
            f.TotalPago AS precio
        FROM Factura f
        JOIN Producto p ON f.Producto = p.IdProducto
        JOIN Categoria c ON p.Categoria = c.IdCategoria
        WHERE 1 = 1
    `;
    
    const params = [];

    if (fechaInicio) {
        query += ' AND f.RegistroCompra >= ?';
        params.push(fechaInicio);
    }
    if (fechaFin) {
        query += ' AND f.RegistroCompra <= ?';
        params.push(fechaFin);
    }
    if (tipoProducto) {
        query += ' AND LOWER(c.NombreCategoria) = ?';
        params.push(tipoProducto.toLowerCase());
    }

    if (ordenPrecio === 'asc') {
        query += ' ORDER BY f.TotalPago ASC';
    } else if (ordenPrecio === 'desc') {
        query += ' ORDER BY f.TotalPago DESC';
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error(' Error en la consulta de historial:', err);
            return res.status(500).json({ error: 'Error en la consulta de historial' });
        }

        res.json(results);
    });
});


// Opcion para descargar el Excel

const ExcelJS = require('exceljs');

app.get('/api/historial/excel', async (req, res) => {
    const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;

    let query = `
        SELECT 
            F.IdFactura,
            Cliente.Nombre AS NombreCliente,
            Comercio.Nombre AS NombreComercio,
            P.NombreProducto,
            F.Cantidad,
            F.ValorUnidad,
            F.TotalPago,
            F.RegistroCompra
        FROM Factura F
        JOIN Perfil Cliente ON F.Usuario = Cliente.Usuario
        JOIN Perfil Comercio ON F.NitComercio = Comercio.Usuario
        JOIN Producto P ON F.Producto = P.IdProducto
        JOIN Categoria C ON P.Categoria = C.IdCategoria
        WHERE 1 = 1
    `;

    const params = [];

    if (fechaInicio && fechaFin) {
        query += ' AND DATE(F.RegistroCompra) BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    if (tipoProducto) {
        query += ' AND LOWER(C.NombreCategoria) = ?';
        params.push(tipoProducto.toLowerCase());
    }

    if (ordenPrecio === 'asc') {
        query += ' ORDER BY F.TotalPago ASC';
    } else if (ordenPrecio === 'desc') {
        query += ' ORDER BY F.TotalPago DESC';
    }

    connection.query(query, params, async (err, results) => {
        if (err) {
            console.error(' Error en consulta Excel:', err);
            return res.status(500).send('Error al generar Excel');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Historial');

        worksheet.columns = [
            { header: '#', key: 'n', width: 5 },
            { header: 'ID Factura', key: 'IdFactura', width: 10 },
            { header: 'Cliente', key: 'NombreCliente', width: 25 },
            { header: 'Comercio', key: 'NombreComercio', width: 25 },
            { header: 'Producto', key: 'NombreProducto', width: 25 },
            { header: 'Cantidad', key: 'Cantidad', width: 10 },
            { header: 'Valor Unidad', key: 'ValorUnidad', width: 15 },
            { header: 'Total Pagado', key: 'TotalPago', width: 15 },
            { header: 'Fecha Compra', key: 'RegistroCompra', width: 20 }
        ];

    results.forEach((row, i) => {
        worksheet.addRow({
            n: i + 1,
            IdFactura: row.IdFactura,
            NombreCliente: row.NombreCliente,
            NombreComercio: row.NombreComercio,
            NombreProducto: row.NombreProducto,
            Cantidad: row.Cantidad,
            ValorUnidad: Number(row.ValorUnidad), 
            TotalPago: Number(row.TotalPago),   
            RegistroCompra: row.RegistroCompra.toISOString().split('T')[0]
        });
    });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=historial_compras.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    });
});

// Historial de ventas (JSON)
app.get('/api/historial-ventas', (req, res) => {
    const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;

    let query = `
        SELECT 
            f.IdFactura,
            c.NombreCategoria AS NombreCategoria,
            f.RegistroCompra AS RegistroCompra,
            p.NombreProducto AS NombreProducto,
            i.Cantidad,
            i.TotalCompra
        FROM Inventario i
        JOIN Factura f ON i.IdFactura = f.IdFactura
        JOIN Producto p ON f.Producto = p.IdProducto
        JOIN Categoria c ON p.Categoria = c.IdCategoria
        WHERE 1 = 1
    `;

    const params = [];

    if (fechaInicio) {
        query += ' AND f.RegistroCompra >= ?';
        params.push(fechaInicio);
    }
    if (fechaFin) {
        query += ' AND f.RegistroCompra <= ?';
        params.push(fechaFin);
    }
    if (tipoProducto) {
        query += ' AND LOWER(c.NombreCategoria) = ?';
        params.push(tipoProducto.toLowerCase());
    }

    if (ordenPrecio === 'asc') {
        query += ' ORDER BY i.TotalCompra ASC';
    } else if (ordenPrecio === 'desc') {
        query += ' ORDER BY i.TotalCompra DESC';
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error en la consulta de historial de ventas:', err);
            return res.status(500).json({ error: 'Error en la consulta de historial de ventas' });
        }

        res.json(results);
    });
});

// Historial de ventas (Excel)
app.get('/api/historial-ventas/excel', async (req, res) => {
    const { fechaInicio, fechaFin, tipoProducto, ordenPrecio } = req.query;

    let query = `
        SELECT 
            f.IdFactura,
            c.NombreCategoria AS NombreCategoria,
            f.RegistroCompra AS RegistroCompra,
            p.NombreProducto AS NombreProducto,
            i.Cantidad,
            i.TotalCompra
        FROM Inventario i
        JOIN Factura f ON i.IdFactura = f.IdFactura
        JOIN Producto p ON f.Producto = p.IdProducto
        JOIN Categoria c ON p.Categoria = c.IdCategoria
        WHERE 1 = 1
    `;

    const params = [];

    if (fechaInicio) {
        query += ' AND f.RegistroCompra >= ?';
        params.push(fechaInicio);
    }
    if (fechaFin) {
        query += ' AND f.RegistroCompra <= ?';
        params.push(fechaFin);
    }
    if (tipoProducto) {
        query += ' AND LOWER(c.NombreCategoria) = ?';
        params.push(tipoProducto.toLowerCase());
    }

    if (ordenPrecio === 'asc') {
        query += ' ORDER BY i.TotalCompra ASC';
    } else if (ordenPrecio === 'desc') {
        query += ' ORDER BY i.TotalCompra DESC';
    }

    connection.query(query, params, async (err, results) => {
        if (err) {
            console.error('❌ Error al generar Excel de ventas:', err);
            return res.status(500).send('Error al generar Excel de ventas');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Historial Ventas');

        // Definir columnas
        worksheet.columns = [
            { header: '#', key: 'n', width: 5 },
            { header: 'Id Factura', key: 'IdFactura', width: 15 },
            { header: 'Categoría', key: 'NombreCategoria', width: 20 },
            { header: 'Fecha Compra', key: 'RegistroCompra', width: 20 },
            { header: 'Producto', key: 'NombreProducto', width: 30 },
            { header: 'Cantidad', key: 'Cantidad', width: 15 },
            { header: 'Total Compra', key: 'TotalCompra', width: 20 }
        ];

        // Insertar filas
        results.forEach((row, i) => {
            worksheet.addRow({
                n: i + 1,
                IdFactura: row.IdFactura,
                NombreCategoria: row.NombreCategoria,
                RegistroCompra: row.RegistroCompra.toISOString().split('T')[0],
                NombreProducto: row.NombreProducto,
                Cantidad: row.Cantidad,
                TotalCompra: Number(row.TotalCompra)
            });
        });

        // Enviar archivo Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=historial_ventas.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    });
});




// Ruta para obtener los talleres
app.get('/api/talleres', (req, res) => {
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

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener ubicaciones:', err);
            return res.status(500).json({ error: 'Error al obtener ubicaciones' });
        }
        res.json(results);
    });
});




//Codigo para el registro de usuarios

const axios = require("axios");
const multer = require("multer");



// Configuración de Multer para manejar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "public", "image"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Ruta unificada de registro
app.post("/api/registro", upload.fields([
    { name: "FotoPerfil", maxCount: 1 },
    { name: "Certificado", maxCount: 1 }
]), async (req, res) => {
    try {
        const data = req.body;
        const files = req.files;

        // INSERT en Perfil
        const perfilSQL = `
            INSERT INTO Perfil (Usuario, TipoUsuario, Nombre, FotoPerfil, Correo, Direccion, Telefono, Barrio, FechaRegistro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const perfilValues = [
            data.Usuario,
            data.TipoUsuario,
            data.Nombre,
            files?.FotoPerfil ? files.FotoPerfil[0].filename : null,
            data.Correo,
            data.Direccion,
            data.Telefono,
            data.Barrio
        ];

        connection.query(perfilSQL, perfilValues, async (err, result) => {
            if (err) {
                console.error("Error en INSERT Perfil:", err);
                return res.status(500).json({ error: "Error al registrar perfil" });
            }
            function normalizarDireccion(dir) {
                return dir
                    .replace(/\bCra\b/gi, "Carrera")
                    .replace(/\bCl\b/gi, "Calle")
                    .replace(/\bAv\b/gi, "Avenida");
                }


            // Comerciante con geocodificación de dirección
            const direccionCompleta = `${data.Direccion}, Bogotá, Colombia`;
            if (data.TipoUsuario === "comerciante") {
                let lat = null;
                let lon = null;

                try {
                    const direccionNormalizada = normalizarDireccion(data.Direccion);
                    const direccionCompleta = `${direccionNormalizada}, Bogotá, Colombia`;

                    const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
                        params: {
                            q: direccionCompleta,
                            format: "json",
                            limit: 1,
                            countrycodes: "co"
                        },
                        headers: { "User-Agent": "RPMMarket/1.0 (tu_email@ejemplo.com)" } // obligatorio para Nominatim
                    });

                    if (geoRes.data.length > 0) {
                        lat = geoRes.data[0].lat;
                        lon = geoRes.data[0].lon;
                    }
                } catch (geoErr) {
                    console.error("Error al obtener coordenadas:", geoErr.message);
                }

                const infoSQL = `
                    INSERT INTO InformacionVendedor 
                    (InfoVendedor, DiasAtencion, RedesSociales, Latitud, Longitud, NombreComercio, NitComercio, HoraInicio, HoraFin)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const infoValues = [
                    data.Usuario,
                    data.DiasAtencion || null,
                    data.RedesSociales || null,
                    lat,
                    lon,
                    data.NombreComercio || null,
                    data.NitComercio || null,
                    data.HoraInicio || null,
                    data.HoraFin || null
                ];

                connection.query(infoSQL, infoValues, (err2) => {
                    if (err2) {
                        console.error("Error en INSERT InformacionVendedores:", err2);
                        return res.status(500).json({ error: "Error al registrar comerciante" });
                    }
                    res.json({ message: "Comerciante registrado correctamente con coordenadas" });
                });

            } else if (data.TipoUsuario === "servicio") {
                // Prestador de servicios
                const infoSQL = `
                    INSERT INTO PrestadorServicios
                    (IdPrestador, Certificado, RedesSociales, DiasAtencion, HoraInicio, HoraFin)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const infoValues = [
                    data.Usuario,
                    files?.Certificado ? files.Certificado[0].filename : null,
                    data.RedesSociales || null,
                    data.DiasAtencion || null,
                    data.HoraInicio || null,
                    data.HoraFin || null
                ];
                connection.query(infoSQL, infoValues, (err2) => {
                    if (err2) {
                        console.error("Error en INSERT PrestadorServicios:", err2);
                        return res.status(500).json({ error: "Error al registrar prestador de servicios" });
                    }
                    res.json({ message: "Prestador de servicios registrado correctamente" });
                });

            } else {
                // Usuario natural
                res.json({ message: "Usuario natural registrado correctamente" });
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
