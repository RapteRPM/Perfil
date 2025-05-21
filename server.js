const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;


app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',        
    password: 'root',     
    database: 'rpm'      
});

// Conectar a MySQL
connection.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('✅ Conectado a la base de datos con ID ' + connection.threadId);
});

// Ruta para validar el login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Verificamos si llegaron los datos
    console.log('🟡 Usuario recibido:', username);
    console.log('🟡 Contraseña recibida:', password);

    const query = 'SELECT * FROM Credenciales WHERE TRIM(NombreUsuario) = TRIM(?) AND TRIM(Contrasena) = TRIM(?)';

    connection.query(query, [username, password], (error, results) => {
        if (error) {
            console.error('❌ Error en la consulta:', error); // Este mostrará el motivo del error 500
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        console.log('🔍 Resultado de la consulta:', results);

        if (results.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    });
});
app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${port}/index.html`);
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
            console.error('❌ Error en la consulta de historial:', err);
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
            console.error('❌ Error en consulta Excel:', err);
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
