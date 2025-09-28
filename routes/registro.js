const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../server");

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 📌 Registro Usuario Natural
router.post("/registro", upload.single("fotoPerfil"), (req, res) => {
    const { Usuario, Nombre, Correo, Direccion, Telefono, Barrio } = req.body;
    const FotoPerfil = req.file ? req.file.filename : null;

    const query = `
    INSERT INTO Perfil (Usuario, Nombre, FotoPerfil, Correo, Direccion, Telefono, FechaRegistro, Barrio)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    db.query(query, [Usuario, Nombre, FotoPerfil, Correo, Direccion, Telefono, Barrio], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al registrar natural" });
        res.json({ message: "Usuario natural registrado", id: result.insertId });
    });
});

// 📌 Registro Usuario Comerciante
router.post("/registro", upload.single("fotoPerfil"), (req, res) => {
    const { Usuario, Nombre, Correo, Telefono, NombreComercio, DireccionComercio } = req.body;
    const FotoPerfil = req.file ? req.file.filename : null;

    const query = `
    INSERT INTO InformacionVendedor (Usuario, Nombre, FotoPerfil, Correo, Telefono, NombreComercio, DireccionComercio, FechaRegistro)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(query, [Usuario, Nombre, FotoPerfil, Correo, Telefono, NombreComercio, DireccionComercio], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al registrar comerciante" });
        res.json({ message: "Usuario comerciante registrado", id: result.insertId });
    });
});

// 📌 Registro Prestador de Servicios
router.post("/registro", upload.single("fotoPerfil"), (req, res) => {
    const { Usuario, Nombre, Correo, Telefono, TipoServicio, Horario } = req.body;
    const FotoPerfil = req.file ? req.file.filename : null;

    const query = `
    INSERT INTO InformacionVendedor (Usuario, Nombre, FotoPerfil, Correo, Telefono, TipoServicio, Horario, FechaRegistro)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(query, [Usuario, Nombre, FotoPerfil, Correo, Telefono, TipoServicio, Horario], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al registrar servicio" });
        res.json({ message: "Usuario de servicios registrado", id: result.insertId });
    });
});

module.exports = router;
