const express = require('express');
const router = express.Router();
const db = require('../db');

// Métricas para Panel Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [[totalViviendas]] = await db.query('SELECT COUNT(*) as total FROM Vivienda');
    const [[pagosPendientes]] = await db.query('SELECT COUNT(*) as total FROM Pago WHERE estado = "Pendiente"');
    const [[recaudoMes]] = await db.query('SELECT SUM(monto) as total FROM Pago WHERE estado = "Aprobado" AND MONTH(fecha_pago) = MONTH(CURRENT_DATE())');

    res.json({
      totalViviendas: totalViviendas.total,
      pagosPendientes: pagosPendientes.total,
      recaudoMes: recaudoMes.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aprobación de pagos
router.get('/pagos-pendientes', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, v.numero_vivienda FROM Pago p JOIN Vivienda v ON p.id_vivienda = v.id_vivienda WHERE p.estado = "Pendiente"'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/aprobar-pago', async (req, res) => {
  const { id_pago, estado } = req.body; // 'Aprobado' o 'Rechazado'
  try {
    await db.query('UPDATE Pago SET estado = ? WHERE id_pago = ?', [estado, id_pago]);
    
    if (estado === 'Aprobado') {
      const [[pago]] = await db.query('SELECT id_cargo FROM Pago WHERE id_pago = ?', [id_pago]);
      if (pago && pago.id_cargo) {
        await db.query('UPDATE Cargo SET estado = "Pagado" WHERE id_cargo = ?', [pago.id_cargo]);
      }
    }
    res.json({ message: `Pago ${estado.toLowerCase()} correctamente.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;