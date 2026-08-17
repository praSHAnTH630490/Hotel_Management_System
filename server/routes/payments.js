import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const PAYMENT_SELECT = `
  SELECT p.*, c.name AS customer_name, rm.room_number
  FROM payment p
  JOIN reservation res ON res.reservation_id = p.reservation_id
  JOIN customer c ON c.customer_id = res.customer_id
  JOIN room rm ON rm.room_id = res.room_id
`;

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? ' WHERE p.payment_status = ?' : '';
    const [rows] = await pool.query(PAYMENT_SELECT + where + ' ORDER BY p.payment_date DESC', status ? [status] : []);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { reservation_id, payment_date, amount, payment_method, payment_status, transaction_id } = req.body;
    if (!reservation_id || !payment_date || amount == null || !payment_method) {
      return res.status(400).json({ error: 'reservation_id, payment_date, amount and payment_method are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO payment (reservation_id, payment_date, amount, payment_method, payment_status, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reservation_id, payment_date, amount, payment_method, payment_status || 'Pending', transaction_id || null]
    );
    const [rows] = await pool.query(PAYMENT_SELECT + ' WHERE p.payment_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Transaction ID already exists' });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { payment_status, transaction_id } = req.body;
    await pool.query('UPDATE payment SET payment_status = ?, transaction_id = ? WHERE payment_id = ?', [payment_status, transaction_id || null, req.params.id]);
    const [rows] = await pool.query(PAYMENT_SELECT + ' WHERE p.payment_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
