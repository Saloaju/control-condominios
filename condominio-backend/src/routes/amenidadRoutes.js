const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar amenidades
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Amenidad');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar reservas
router.get('/reservas/:id_amenidad', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Reserva WHERE id_amenidad = ? AND estado != "Cancelada"',
      [req.params.id_amenidad]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear reserva
router.post('/reservar', async (req, res) => {
  const { id_vivienda, id_amenidad, fecha_reserva, hora_inicio, hora_fin, monto_pago } = req.body;
  try {
    await db.query(
      'INSERT INTO Reserva (id_vivienda, id_amenidad, fecha_reserva, hora_inicio, hora_fin, monto_pago, estado) VALUES (?, ?, ?, ?, ?, ?, "Confirmada")',
      [id_vivienda, id_amenidad, fecha_reserva, hora_inicio, hora_fin, monto_pago]
    );
    res.json({ message: 'Reserva creada exitosamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;