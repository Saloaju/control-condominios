const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// 1. INICIO DE SESIÓN (PG4ADC-43)
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT u.*, v.numero_vivienda FROM Usuario u LEFT JOIN Vivienda v ON u.id_vivienda = v.id_vivienda WHERE u.correo = ?',
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = rows[0];

    if (password !== usuario.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol, id_vivienda: usuario.id_vivienda },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        id_vivienda: usuario.id_vivienda,
        numero_vivienda: usuario.numero_vivienda
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREAR NUEVO USUARIO / ADMINISTRADOR (PG4ADC-44 y PG4ADC-7)
router.post('/register', async (req, res) => {
  const { nombre, correo, password, rol, id_vivienda } = req.body;
  try {
    // Validar si el correo ya existe
    const [existente] = await db.query('SELECT * FROM Usuario WHERE correo = ?', [correo]);
    if (existente.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Insertar el nuevo usuario en la base de datos
    const [result] = await db.query(
      'INSERT INTO Usuario (nombre, correo, password, rol, id_vivienda) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, password, rol || 'USUARIO', id_vivienda || null]
    );

    res.json({ message: 'Usuario registrado exitosamente', id_usuario: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;