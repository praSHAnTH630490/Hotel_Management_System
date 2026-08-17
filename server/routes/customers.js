import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/customers  (optional ?search=)
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customer';
    const params = [];
    if (search) {
      sql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY customer_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customer WHERE customer_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
    const [reservations] = await pool.query(
      `SELECT r.*, rm.room_number FROM reservation r JOIN room rm ON rm.room_id = r.room_id
       WHERE r.customer_id = ? ORDER BY r.check_in_date DESC`,
      [req.params.id]
    );
    res.json({ ...rows[0], reservations });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'name, email and phone are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO customer (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone, address || null]
    );
    const [rows] = await pool.query('SELECT * FROM customer WHERE customer_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    await pool.query(
      'UPDATE customer SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?',
      [name, email, phone, address || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM customer WHERE customer_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM customer WHERE customer_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Customer has reservations and cannot be deleted' });
    }
    next(err);
  }
});

export default router;
