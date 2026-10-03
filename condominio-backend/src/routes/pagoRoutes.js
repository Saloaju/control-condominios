const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Obtener estado de cuenta por vivienda
router.get('/estado-cuenta/:id_vivienda', async (req, res) => {
  try {
    const [cargos] = await db.query(
      'SELECT * FROM Cargo WHERE id_vivienda = ? ORDER BY fecha_emision DESC',
      [req.params.id_vivienda]
    );
    const [pagos] = await db.query(
      'SELECT * FROM Pago WHERE id_vivienda = ? ORDER BY fecha_pago DESC',
      [req.params.id_vivienda]
    );
    res.json({ cargos, pagos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar un comprobante de pago
router.post('/reportar-pago', upload.single('comprobante'), async (req, res) => {
  const { id_vivienda, id_cargo, monto, metodo_pago } = req.body;
  const comprobante_url = req.file ? req.file.filename : null;

  try {
    await db.query(
      'INSERT INTO Pago (id_vivienda, id_cargo, monto, metodo_pago, comprobante_url, estado) VALUES (?, ?, ?, ?, ?, "Pendiente")',
      [id_vivienda, id_cargo || null, monto, metodo_pago, comprobante_url]
    );
    res.json({ message: 'Pago reportado con éxito, pendiente de aprobación.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;