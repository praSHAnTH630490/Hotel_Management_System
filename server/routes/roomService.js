import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const SERVICE_SELECT = `
  SELECT rs.*, c.name AS customer_name, rm.room_number
  FROM room_service rs
  JOIN reservation res ON res.reservation_id = rs.reservation_id
  JOIN customer c ON c.customer_id = res.customer_id
  JOIN room rm ON rm.room_id = res.room_id
`;

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? ' WHERE rs.status = ?' : '';
    const [rows] = await pool.query(SERVICE_SELECT + where + ' ORDER BY rs.service_date DESC', status ? [status] : []);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { reservation_id, service_date, service_type, amount } = req.body;
    if (!reservation_id || !service_date || !service_type || amount == null) {
      return res.status(400).json({ error: 'reservation_id, service_date, service_type and amount are required' });
    }
    const [result] = await pool.query(
      "INSERT INTO room_service (reservation_id, service_date, service_type, amount, status) VALUES (?, ?, ?, ?, 'Requested')",
      [reservation_id, service_date, service_type, amount]
    );
    const [rows] = await pool.query(SERVICE_SELECT + ' WHERE rs.service_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id/complete', async (req, res, next) => {
  try {
    await pool.query("UPDATE room_service SET status = 'Completed' WHERE service_id = ?", [req.params.id]);
    const [rows] = await pool.query(SERVICE_SELECT + ' WHERE rs.service_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Service request not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
